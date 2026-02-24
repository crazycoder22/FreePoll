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
    },
  });

  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-close if deadline has passed
  if (
    poll.status === "ACTIVE" &&
    poll.closesAt &&
    new Date() > poll.closesAt
  ) {
    await prisma.poll.update({ where: { id }, data: { status: "CLOSED" } });
    poll.status = "CLOSED";
  }

  // Never expose vote counts to public while poll is active
  return NextResponse.json(poll);
}
