import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

const VOTER_COOKIE = "fp_voter_token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;
  const { answers } = await request.json();

  if (!answers || !Array.isArray(answers)) {
    return NextResponse.json({ error: "answers array is required" }, { status: 400 });
  }

  // Verify survey exists and is active
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
    },
  });

  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  // Auto-close if past deadline
  if (survey.status === "ACTIVE" && survey.closesAt && new Date() > survey.closesAt) {
    await prisma.survey.update({ where: { id: surveyId }, data: { status: "CLOSED" } });
    return NextResponse.json({ error: "This survey has closed" }, { status: 403 });
  }

  if (survey.status !== "ACTIVE") {
    return NextResponse.json({ error: "This survey is not accepting responses" }, { status: 403 });
  }

  // Get or create voter token
  let voterToken = request.cookies.get(VOTER_COOKIE)?.value;
  let isNewToken = false;
  if (!voterToken) {
    voterToken = nanoid(24);
    isNewToken = true;
  }

  // Check if already responded
  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_voterToken: { surveyId, voterToken } },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already responded to this survey" }, { status: 409 });
  }

  // Build a map of questions for validation
  const questionMap = new Map(survey.questions.map((q) => [q.id, q]));

  // Validate answers
  const answerData: { questionId: string; optionId: string | null; textValue: string | null }[] = [];

  for (const q of survey.questions) {
    const answer = answers.find((a: { questionId: string }) => a.questionId === q.id);

    if (!answer && q.required) {
      return NextResponse.json(
        { error: `Question "${q.text}" is required` },
        { status: 400 }
      );
    }

    if (!answer) continue;

    if (q.type === "SINGLE_SELECT") {
      if (answer.optionId) {
        const validOption = q.options.find((o) => o.id === answer.optionId);
        if (!validOption) {
          return NextResponse.json({ error: "Invalid option selected" }, { status: 400 });
        }
        answerData.push({ questionId: q.id, optionId: answer.optionId, textValue: null });
      } else if (q.allowOtherText && answer.textValue?.trim()) {
        answerData.push({ questionId: q.id, optionId: null, textValue: answer.textValue.trim() });
      } else if (q.required) {
        return NextResponse.json(
          { error: `Question "${q.text}" is required` },
          { status: 400 }
        );
      }
    } else if (q.type === "FREE_TEXT") {
      if (q.required && !answer.textValue?.trim()) {
        return NextResponse.json(
          { error: `Question "${q.text}" is required` },
          { status: 400 }
        );
      }
      if (answer.textValue?.trim()) {
        answerData.push({ questionId: q.id, optionId: null, textValue: answer.textValue.trim() });
      }
    }
  }

  // Create response + answers in a transaction
  await prisma.$transaction(async (tx) => {
    const surveyResponse = await tx.surveyResponse.create({
      data: { surveyId, voterToken },
    });

    if (answerData.length > 0) {
      await tx.surveyAnswer.createMany({
        data: answerData.map((a) => ({
          responseId: surveyResponse.id,
          questionId: a.questionId,
          optionId: a.optionId,
          textValue: a.textValue,
        })),
      });
    }
  });

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
