import { NextResponse } from "next/server";
import { allScopedResponses, makeCsv, type ResponseFilters } from "@mast/database";
import { currentAdmin } from "../../../../auth";

function buildFilters(url: URL): ResponseFilters {
  const search = url.searchParams.get("search")?.trim() || undefined;
  const zoneId = url.searchParams.get("zoneId") || undefined;
  const centerId = url.searchParams.get("centerId") || undefined;
  const primaryType = url.searchParams.get("primaryType") || undefined;
  const secondaryType = url.searchParams.get("secondaryType") || undefined;
  const gender = url.searchParams.get("gender") || undefined;
  const valid = url.searchParams.get("valid") || undefined;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  return {
    search,
    zoneId,
    centerId,
    primaryType,
    secondaryType,
    gender,
    valid,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined
  };
}

export async function GET(request: Request) {
  const session = await currentAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const filters = buildFilters(url);
  const responses = await allScopedResponses(session, filters);

  return new NextResponse(makeCsv(responses), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"mast-responses.csv\""
    }
  });
}
