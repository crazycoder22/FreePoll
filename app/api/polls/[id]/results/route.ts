import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (poll.status !== "CLOSED") {
    return NextResponse.json(
      { error: "Results are only available after the poll closes" },
      { status: 403 }
    );
  }

  const voteCounts = await prisma.vote.groupBy({
    by: ["optionId"],
    where: { pollId },
    _count: { optionId: true },
  });

  const total = voteCounts.reduce((sum, v) => sum + v._count.optionId, 0);

  const results = poll.options.map((option) => {
    const count = voteCounts.find((v) => v.optionId === option.id)?._count.optionId ?? 0;
    return {
      ...option,
      votes: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  results.sort((a, b) => b.votes - a.votes);

  return NextResponse.json({ poll, results, total });
}
