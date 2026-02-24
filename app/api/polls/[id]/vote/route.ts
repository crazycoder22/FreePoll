import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const VOTER_COOKIE = "fp_voter_token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const body = await request.json();
  const { optionId, optionIds, voterInfo } = body;

  // Verify poll is active
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  // Auto-close if past deadline
  if (poll.status === "ACTIVE" && poll.closesAt && new Date() > poll.closesAt) {
    await prisma.poll.update({ where: { id: pollId }, data: { status: "CLOSED" } });
    return NextResponse.json({ error: "This poll has closed" }, { status: 403 });
  }

  if (poll.status !== "ACTIVE") {
    return NextResponse.json({ error: "This poll is not accepting votes" }, { status: 403 });
  }

  // Validate required voter info fields
  for (const field of poll.fields) {
    if (field.required) {
      const val = voterInfo?.[field.id]?.trim();
      if (!val) {
        return NextResponse.json(
          { error: `"${field.label}" is required` },
          { status: 400 }
        );
      }
    }
  }

  // Get or create voter token
  let voterToken = request.cookies.get(VOTER_COOKIE)?.value;
  let isNewToken = false;
  if (!voterToken) {
    voterToken = nanoid(24);
    isNewToken = true;
  }

  // Check if this voter already submitted for this poll
  const existingVote = await prisma.vote.findFirst({
    where: { pollId, voterToken },
  });
  if (existingVote) {
    return NextResponse.json(
      { error: poll.mode === "LIKER" ? "You have already submitted your likes" : "You have already voted in this poll" },
      { status: 409 }
    );
  }

  // Build voter info records (attached to the first vote)
  const voterInfoData = poll.fields
    .filter((f) => voterInfo?.[f.id]?.trim())
    .map((f) => ({ fieldId: f.id, value: voterInfo[f.id].trim() }));

  if (poll.mode === "LIKER") {
    // LIKER mode: voter can like multiple options
    const ids: string[] = Array.isArray(optionIds) ? optionIds : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "Please like at least one option" }, { status: 400 });
    }

    // Verify all option ids belong to this poll
    const validOptions = await prisma.pollOption.findMany({
      where: { id: { in: ids }, pollId },
      select: { id: true },
    });
    if (validOptions.length !== ids.length) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // Create a vote per liked option; attach voterInfo to the first one
    await prisma.$transaction(
      ids.map((oid, i) =>
        prisma.vote.create({
          data: {
            pollId,
            optionId: oid,
            voterToken,
            ...(i === 0 && voterInfoData.length > 0
              ? { voterInfo: { create: voterInfoData } }
              : {}),
          },
        })
      )
    );
  } else {
    // POLL mode: single choice
    if (!optionId) {
      return NextResponse.json({ error: "optionId is required" }, { status: 400 });
    }

    const option = await prisma.pollOption.findFirst({
      where: { id: optionId, pollId },
    });
    if (!option) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        voterToken,
        ...(voterInfoData.length > 0 && {
          voterInfo: { create: voterInfoData },
        }),
      },
    });
  }

  const response = NextResponse.json({ ok: true });
  if (isNewToken) {
    response.cookies.set(VOTER_COOKIE, voterToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
