import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(survey);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, closesAt, questions } = body;

  const existing = await prisma.survey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.survey.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(closesAt !== undefined && {
        closesAt: closesAt ? new Date(closesAt) : null,
      }),
    },
  });

  // Only allow question replacement in DRAFT status
  if (questions && existing.status === "DRAFT") {
    await prisma.surveyQuestion.deleteMany({ where: { surveyId: id } });
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      await prisma.surveyQuestion.create({
        data: {
          surveyId: id,
          text: q.text,
          type: q.type || "SINGLE_SELECT",
          required: q.required ?? true,
          allowOtherText: q.allowOtherText ?? false,
          order: qi,
          options: {
            create: (q.options ?? [])
              .filter((o: { label: string }) => o.label?.trim())
              .map((o: { label: string }, oi: number) => ({
                label: o.label,
                order: oi,
              })),
          },
        },
      });
    }
  }

  const updated = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.survey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
