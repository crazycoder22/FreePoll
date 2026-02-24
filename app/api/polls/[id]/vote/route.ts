import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const VOTER_COOKIE = "fp_voter_token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const { optionId } = await request.json();

  if (!optionId) {
    return NextResponse.json({ error: "optionId is required" }, { status: 400 });
  }

  // Verify poll is active
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  // Auto-close if past deadline
  if (poll.status === "ACTIVE" && poll.closesAt && new Date() > poll.closesAt) {
    await prisma.poll.update({ where: { id: pollId }, data: { status: "CLOSED" } });
    return NextResponse.json({ error: "This poll has closed" }, { status: 403 });
  }

  if (poll.status !== "ACTIVE") {
    return NextResponse.json({ error: "This poll is not accepting votes" }, { status: 403 });
  }

  // Get or create voter token
  let voterToken = request.cookies.get(VOTER_COOKIE)?.value;
  let isNewToken = false;
  if (!voterToken) {
    voterToken = nanoid(24);
    isNewToken = true;
  }

  // Check if already voted
  const existing = await prisma.vote.findUnique({
    where: { pollId_voterToken: { pollId, voterToken } },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already voted in this poll" }, { status: 409 });
  }

  // Verify the option belongs to this poll
  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, pollId },
  });
  if (!option) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  await prisma.vote.create({
    data: { pollId, optionId, voterToken },
  });

  const response = NextResponse.json({ ok: true });

  if (isNewToken) {
    response.cookies.set(VOTER_COOKIE, voterToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}
