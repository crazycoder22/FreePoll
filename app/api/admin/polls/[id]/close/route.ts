import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const poll = await prisma.poll.update({
    where: { id },
    data: { status: "CLOSED" },
  });
  return NextResponse.json(poll);
}
