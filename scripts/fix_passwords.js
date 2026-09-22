const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const credsPath = path.resolve(__dirname, '../output/admin-credentials.json');
if (!fs.existsSync(credsPath)) {
  console.error('Credentials file not found at:', credsPath);
  process.exit(1);
}

const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

const allAdmins = [];
if (credsData.mainMasterAdmin) allAdmins.push(credsData.mainMasterAdmin);
if (credsData.maleMasterAdmin) allAdmins.push(credsData.maleMasterAdmin);
if (credsData.femaleMasterAdmin) allAdmins.push(credsData.femaleMasterAdmin);
if (credsData.mainAdmin) allAdmins.push(credsData.mainAdmin);
if (Array.isArray(credsData.zoneAdmins)) allAdmins.push(...credsData.zoneAdmins);
if (Array.isArray(credsData.centerAdmins)) allAdmins.push(...credsData.centerAdmins);

console.log(`Found ${allAdmins.length} admin accounts in credentials file.`);

const dbPaths = [
  path.resolve(__dirname, '../data/mast.sqlite'),
  path.resolve(__dirname, '../output/firebase_dump.sqlite'),
  path.resolve(__dirname, '../../MAST Test V2/output/firebase_dump.sqlite')
];

for (const dbPath of dbPaths) {
  if (!fs.existsSync(dbPath)) {
    console.log(`DB path not found, skipping: ${dbPath}`);
    continue;
  }

  console.log(`Updating passwords in database: ${dbPath}`);
  const db = new Database(dbPath);

  const updateStmt = db.prepare('UPDATE admin_users SET password_hash = ? WHERE LOWER(email) = ?');
  let updatedCount = 0;

  for (const admin of allAdmins) {
    if (!admin.email || !admin.password) continue;
    const hash = bcrypt.hashSync(admin.password, 10);
    const result = updateStmt.run(hash, admin.email.toLowerCase());
    if (result.changes > 0) {
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} admin password hashes in ${path.basename(dbPath)}.`);
  db.close();
}

console.log('Password hash fix complete!');
