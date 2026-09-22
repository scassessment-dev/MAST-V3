import { NextResponse } from "next/server";
import { z } from "zod";
import { validateServicePriorities } from "@mast/core";
import { getTestResponseById, updateResponseValidation } from "@mast/database";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const response = await getTestResponseById(params.id);

  if (!response) return NextResponse.json({ error: "Result not found." }, { status: 404 });
  return NextResponse.json(response);
}

const patchSchema = z.object({
  secondTestAnswers: z.array(z.boolean()).length(10),
  servicePriorities: z.array(z.string().min(1)).min(1).max(3)
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = patchSchema.parse(await request.json());
    const existing = await getTestResponseById(params.id);
    if (!existing) return NextResponse.json({ error: "Result not found." }, { status: 404 });

    const priorities = validateServicePriorities(body.servicePriorities);
    if (!priorities.valid) return NextResponse.json({ error: priorities.message }, { status: 400 });

    // A completed response is immutable. This makes browser retries safe.
    if (existing.valid) return NextResponse.json({ ok: true, response: existing });

    const response = await updateResponseValidation(params.id, {
      secondTestAnswers: body.secondTestAnswers,
      servicePriorities: body.servicePriorities
    });

    if (!response) return NextResponse.json({ error: "Result not found." }, { status: 404 });
    return NextResponse.json({ ok: true, response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}
