import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const source = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clone = await prisma.survey.create({
    data: {
      title: `${source.title} (copy)`,
      description: source.description,
      questions: {
        create: source.questions.map((q) => ({
          text: q.text,
          type: q.type,
          required: q.required,
          allowOtherText: q.allowOtherText,
          order: q.order,
          options: {
            create: q.options.map((o) => ({
              label: o.label,
              order: o.order,
            })),
          },
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(clone, { status: 201 });
}
