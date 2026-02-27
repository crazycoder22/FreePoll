import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { responses: true, questions: true } },
    },
  });
  return NextResponse.json(surveys);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, closesAt, questions } = body;

  if (!title || !questions || questions.length < 1) {
    return NextResponse.json(
      { error: "Title and at least 1 question are required" },
      { status: 400 }
    );
  }

  for (const q of questions) {
    if (!q.text?.trim()) {
      return NextResponse.json(
        { error: "All questions must have text" },
        { status: 400 }
      );
    }
    if (q.type === "SINGLE_SELECT") {
      const validOpts = (q.options ?? []).filter(
        (o: { label: string }) => o.label?.trim()
      );
      if (validOpts.length < 2) {
        return NextResponse.json(
          { error: `Question "${q.text}" needs at least 2 options` },
          { status: 400 }
        );
      }
    }
  }

  const survey = await prisma.survey.create({
    data: {
      title,
      description: description || null,
      closesAt: closesAt ? new Date(closesAt) : null,
      questions: {
        create: questions.map(
          (
            q: {
              text: string;
              type: string;
              required: boolean;
              allowOtherText: boolean;
              options: { label: string }[];
            },
            qi: number
          ) => ({
            text: q.text,
            type: q.type || "SINGLE_SELECT",
            required: q.required ?? true,
            allowOtherText: q.allowOtherText ?? false,
            order: qi,
            options: {
              create: (q.options ?? [])
                .filter((o) => o.label?.trim())
                .map((o, oi) => ({
                  label: o.label,
                  order: oi,
                })),
            },
          })
        ),
      },
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
