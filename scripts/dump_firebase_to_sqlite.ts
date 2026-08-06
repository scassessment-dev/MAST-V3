import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, DocumentReference, CollectionReference } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

// 1. Load .env.local synchronously if it exists
const envLocalPath = resolve(".env.local");
if (existsSync(envLocalPath)) {
  try {
    // @ts-ignore - process.loadEnvFile available in Node 20.12+
    process.loadEnvFile(envLocalPath);
  } catch {
    const lines = readFileSync(envLocalPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: requireEnv("FIREBASE_PROJECT_ID"),
        clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
        privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
      })
    });
  }
  return {
    db: getFirestore(),
    auth: getAuth()
  };
}

export interface FirestoreDocumentDump {
  path: string;
  collection: string;
  id: string;
  parentPath: string | null;
  data: Record<string, any>;
  hasSubcollections: boolean;
}

export interface ConnectionDump {
  sourceCollection: string;
  sourceDocId: string;
  sourcePath: string;
  sourceField: string;
  targetCollection: string;
  targetDocId: string;
  relationType: string;
}

async function dumpCollectionRecursively(
  colRef: CollectionReference,
  parentPath: string | null,
  allDocs: FirestoreDocumentDump[]
) {
  const snapshot = await colRef.get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Check for subcollections
    const subcols = await doc.ref.listCollections();
    const hasSubcollections = subcols.length > 0;

    allDocs.push({
      path: doc.ref.path,
      collection: colRef.id,
      id: doc.id,
      parentPath: parentPath,
      data: serializeFirestoreData(data),
      hasSubcollections
    });

    for (const subCol of subcols) {
      await dumpCollectionRecursively(subCol, doc.ref.path, allDocs);
    }
  }
}

function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object") {
    if (typeof obj.toDate === "function") {
      return obj.toDate().toISOString();
    }
    if (obj instanceof DocumentReference) {
      return { _type: "DocumentReference", path: obj.path };
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeFirestoreData);
    }
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }
  return obj;
}

async function fetchAuthUsers(auth: ReturnType<typeof getAuth>) {
  const users: any[] = [];
  try {
    let pageToken: string | undefined = undefined;
    do {
      const result = await auth.listUsers(1000, pageToken);
      for (const u of result.users) {
        users.push({
          uid: u.uid,
          email: u.email || null,
          displayName: u.displayName || null,
          phoneNumber: u.phoneNumber || null,
          disabled: u.disabled,
          metadata: {
            creationTime: u.metadata.creationTime,
            lastSignInTime: u.metadata.lastSignInTime,
            lastRefreshTime: u.metadata.lastRefreshTime
          },
          customClaims: u.customClaims || {}
        });
      }
      pageToken = result.pageToken;
    } while (pageToken);
  } catch (err: any) {
    console.warn("Could not list Firebase Auth users:", err.message);
  }
  return users;
}

function detectConnections(allDocs: FirestoreDocumentDump[]): ConnectionDump[] {
  const connections: ConnectionDump[] = [];
  
  // Index docs by collection and doc id
  const docMap = new Map<string, FirestoreDocumentDump>();
  const docsByCollection = new Map<string, FirestoreDocumentDump[]>();

  for (const doc of allDocs) {
    docMap.set(doc.path, doc);
    const existing = docsByCollection.get(doc.collection) || [];
    existing.push(doc);
    docsByCollection.set(doc.collection, existing);
  }

  for (const doc of allDocs) {
    const data = doc.data;
    if (!data) continue;

    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;

      // 1. Direct Document Reference
      if (typeof value === "object" && value._type === "DocumentReference" && value.path) {
        const target = docMap.get(value.path);
        const targetCol = value.path.split("/")[0];
        const targetId = value.path.split("/").pop() || "";
        connections.push({
          sourceCollection: doc.collection,
          sourceDocId: doc.id,
          sourcePath: doc.path,
          sourceField: key,
          targetCollection: targetCol,
          targetDocId: targetId,
          relationType: "doc_reference"
        });
      }

      // 2. Named Foreign Key convention (e.g. zoneId, centerId, userId, testId)
      if (typeof value === "string" && key.endsWith("Id") && key.length > 2) {
        const possibleTargetColName = key.slice(0, -2) + "s"; // e.g. zoneId -> zones, centerId -> centers
        
        // Search if target collection exists and contains document with this ID
        for (const [colName, targetDocs] of docsByCollection.entries()) {
          const match = targetDocs.find((td) => td.id === value);
          if (match) {
            connections.push({
              sourceCollection: doc.collection,
              sourceDocId: doc.id,
              sourcePath: doc.path,
              sourceField: key,
              targetCollection: colName,
              targetDocId: match.id,
              relationType: "foreign_key_id"
            });
          }
        }
      }

      // 3. Parent-Child subcollection relationship
      if (doc.parentPath) {
        const parentDoc = docMap.get(doc.parentPath);
        if (parentDoc) {
          connections.push({
            sourceCollection: doc.collection,
            sourceDocId: doc.id,
            sourcePath: doc.path,
            sourceField: "_parent",
            targetCollection: parentDoc.collection,
            targetDocId: parentDoc.id,
            relationType: "parent_document"
          });
        }
      }
    }
  }

  return connections;
}

async function main() {
  console.log("Connecting to Firebase...");
  const { db, auth } = initFirebase();

  console.log("Fetching root collections...");
  const rootCollections = await db.listCollections();
  console.log(`Found ${rootCollections.length} root collections:`, rootCollections.map((c) => c.id));

  const allDocs: FirestoreDocumentDump[] = [];
  for (const col of rootCollections) {
    console.log(`Dumping collection '${col.id}'...`);
    await dumpCollectionRecursively(col, null, allDocs);
  }

  console.log(`Total Firestore documents retrieved: ${allDocs.length}`);

  console.log("Fetching Firebase Auth users...");
  const authUsers = await fetchAuthUsers(auth);
  console.log(`Total Firebase Auth users retrieved: ${authUsers.length}`);

  console.log("Analyzing connections & relationships between records...");
  const connections = detectConnections(allDocs);
  console.log(`Detected ${connections.length} record connections.`);

  const outputDir = resolve("output");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const dumpFile = resolve(outputDir, "firebase_dump_data.json");
  const fullDump = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalRootCollections: rootCollections.length,
      rootCollections: rootCollections.map((c) => c.id),
      totalDocuments: allDocs.length,
      totalAuthUsers: authUsers.length,
      totalConnections: connections.length
    },
    documents: allDocs,
    authUsers: authUsers,
    connections: connections
  };

  writeFileSync(dumpFile, JSON.stringify(fullDump, null, 2), "utf8");
  console.log(`Saved Firebase dump JSON to ${dumpFile}`);

  console.log("Converting NoSQL Firebase dump into relational SQL SQLite database...");
  try {
    execSync("python scripts/json_to_sqlite.py", { stdio: "inherit" });
    console.log("SQL SQLite database creation complete.");
  } catch (err: any) {
    console.error("Failed to run json_to_sqlite.py:", err.message);
  }
}

main().catch((err) => {
  console.error("Error dumping Firebase:", err);
  process.exit(1);
});
