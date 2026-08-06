import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { adminCookieName, findAdminByEmail, signAdminSession } from "@mast/database";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });

  const admin = await findAdminByEmail(body.data.email);
  if (!admin || !admin.isActive) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  const ok = await bcrypt.compare(body.data.password, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  const token = await signAdminSession({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    genderScope: admin.genderScope,
    zoneId: admin.zoneId,
    centerId: admin.centerId
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
