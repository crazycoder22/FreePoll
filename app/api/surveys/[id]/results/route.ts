import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: surveyId } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (survey.status === "DRAFT") {
    return NextResponse.json(
      { error: "Results are not available for draft surveys" },
      { status: 403 }
    );
  }

  const totalResponses = await prisma.surveyResponse.count({
    where: { surveyId },
  });

  const allAnswers = await prisma.surveyAnswer.findMany({
    where: { response: { surveyId } },
  });

  const questions = survey.questions.map((q) => {
    const qAnswers = allAnswers.filter((a) => a.questionId === q.id);

    if (q.type === "SINGLE_SELECT") {
      const optionCounts = q.options.map((opt) => {
        const count = qAnswers.filter((a) => a.optionId === opt.id).length;
        return {
          id: opt.id,
          label: opt.label,
          count,
          percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
        };
      });
      optionCounts.sort((a, b) => b.count - a.count);

      const otherTexts = qAnswers
        .filter((a) => a.optionId === null && a.textValue)
        .map((a) => a.textValue!);

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        order: q.order,
        options: optionCounts,
        otherTexts,
        otherCount: otherTexts.length,
      };
    } else {
      const textResponses = qAnswers
        .filter((a) => a.textValue)
        .map((a) => a.textValue!);

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        order: q.order,
        textResponses,
      };
    }
  });

  return NextResponse.json({ survey, totalResponses, questions });
}
