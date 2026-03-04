import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ voteId: string }> }
) {
  const { voteId } = await params;
  await prisma.vote.delete({ where: { id: voteId } });
  return NextResponse.json({ ok: true });
}
