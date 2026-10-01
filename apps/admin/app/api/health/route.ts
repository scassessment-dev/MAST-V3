import { checkMariaDbConnection } from "@mast/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkMariaDbConnection();
    return Response.json({ status: "ok", service: "mast-admin", database: "connected" });
  } catch {
    return Response.json({ status: "unavailable", service: "mast-admin", database: "unavailable" }, { status: 503 });
  }
}
