import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreAnswers } from "@mast/core";
import { createTestResponse, getCenterById } from "@mast/database";

export const dynamic = "force-dynamic";

const optionSchema = z.enum(["A", "B", "C", "D"]);
const submitSchema = z.object({
  participantName: z.string().trim().min(2).max(100),
  globalId: z.string().trim().max(100).optional(),
  age: z.number().int().min(8).max(120),
  gender: z.enum(["Male", "Female"]),
  centerId: z.string().min(1),
  answers: z.array(
    z.object({
      blockNumber: z.number().int().min(1).max(10),
      most: optionSchema,
      least: optionSchema
    })
  )
});

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const center = await getCenterById(body.centerId);
    if (!center) return NextResponse.json({ error: "Center not found." }, { status: 400 });

    const score = scoreAnswers(body.answers);
    const response = await createTestResponse({
      participantName: body.participantName,
      globalId: body.globalId || null,
      age: body.age,
      gender: body.gender,
      center,
      answers: body.answers,
      score
    });

    return NextResponse.json({ responseId: response.id, ...score });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid submission." },
      { status: 400 }
    );
  }
}
