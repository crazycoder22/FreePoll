import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const source = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.poll.create({
    data: {
      title: `${source.title} (Copy)`,
      description: source.description,
      mode: source.mode,
      status: "DRAFT",
      closesAt: null,
      options: {
        create: source.options.map((o) => ({
          label: o.label,
          description: o.description,
          imageUrl: o.imageUrl,
          order: o.order,
        })),
      },
      fields: {
        create: source.fields.map((f) => ({
          label: f.label,
          required: f.required,
          order: f.order,
        })),
      },
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
