import { SignJWT, jwtVerify } from "jose";

export type AdminRole = "MASTER_ADMIN" | "ZONE_ADMIN" | "CENTER_ADMIN";

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  genderScope: "Male" | "Female" | "All";
  zoneId: string | null;
  centerId: string | null;
};

const COOKIE_NAME = "mast_admin_session";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set to at least 16 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(session: AdminSession): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminSession(token?: string): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export function adminCookieName(): string {
  return COOKIE_NAME;
}
