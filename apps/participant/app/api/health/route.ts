import { checkMariaDbConnection } from "@mast/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkMariaDbConnection();
    return Response.json({ status: "ok", service: "mast-participant", database: "connected" });
  } catch {
    return Response.json({ status: "unavailable", service: "mast-participant", database: "unavailable" }, { status: 503 });
  }
}
