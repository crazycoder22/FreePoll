import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { votes: true, options: true } },
    },
  });
  return NextResponse.json(polls);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, closesAt, mode, options, fields } = body;

  if (!title || !options || options.length < 2) {
    return NextResponse.json(
      { error: "Title and at least 2 options are required" },
      { status: 400 }
    );
  }

  const poll = await prisma.poll.create({
    data: {
      title,
      description: description || null,
      mode: mode === "LIKER" ? "LIKER" : "POLL",
      closesAt: closesAt ? new Date(closesAt) : null,
      options: {
        create: options.map(
          (
            opt: { label: string; description?: string; imageUrl?: string },
            i: number
          ) => ({
            label: opt.label,
            description: opt.description || null,
            imageUrl: opt.imageUrl || null,
            order: i,
          })
        ),
      },
      fields: {
        create: (fields ?? []).map(
          (f: { label: string; required?: boolean }, i: number) => ({
            label: f.label,
            required: f.required ?? false,
            order: i,
          })
        ),
      },
    },
    include: { options: true, fields: true },
  });

  return NextResponse.json(poll, { status: 201 });
}
