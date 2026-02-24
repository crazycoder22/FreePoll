import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      fields: { orderBy: { order: "asc" } },
      _count: { select: { votes: true } },
    },
  });
  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(poll);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, closesAt, options, fields } = body;

  const poll = await prisma.poll.update({
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

  // If options provided, replace them all
  if (options) {
    await prisma.pollOption.deleteMany({ where: { pollId: id } });
    await prisma.pollOption.createMany({
      data: options.map(
        (
          opt: { label: string; description?: string; imageUrl?: string },
          i: number
        ) => ({
          pollId: id,
          label: opt.label,
          description: opt.description || null,
          imageUrl: opt.imageUrl || null,
          order: i,
        })
      ),
    });
  }

  // If fields provided, replace them all
  if (fields) {
    await prisma.voterInfo.deleteMany({
      where: { field: { pollId: id } },
    });
    await prisma.pollField.deleteMany({ where: { pollId: id } });
    if (fields.length > 0) {
      await prisma.pollField.createMany({
        data: fields.map(
          (f: { label: string; required?: boolean }, i: number) => ({
            pollId: id,
            label: f.label,
            required: f.required ?? false,
            order: i,
          })
        ),
      });
    }
  }

  const updated = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      fields: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.poll.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
