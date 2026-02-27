import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!survey) notFound();

  if (survey.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results not available yet</h1>
          <p className="text-gray-500">This survey has not been activated yet.</p>
          <a
            href={`/survey/${id}`}
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to survey
          </a>
        </div>
      </div>
    );
  }

  const isLive = survey.status === "ACTIVE";

  const totalResponses = await prisma.surveyResponse.count({
    where: { surveyId: id },
  });

  const allAnswers = await prisma.surveyAnswer.findMany({
    where: { response: { surveyId: id } },
  });

  const questionResults = survey.questions.map((q) => {
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

      return { ...q, resultType: "select" as const, optionCounts, otherTexts };
    } else {
      const textResponses = qAnswers
        .filter((a) => a.textValue)
        .map((a) => a.textValue!);

      return { ...q, resultType: "text" as const, textResponses };
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <span className="text-lg font-bold text-gray-900">FreePoll</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
            isLive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {isLive ? "Live results" : "Survey closed"}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-gray-500">{survey.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-400">{totalResponses} total responses</p>
        </div>

        <div className="space-y-6">
          {questionResults.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-semibold text-gray-900 mb-4">
                <span className="text-gray-400 text-sm mr-1.5">Q{qi + 1}.</span>
                {q.text}
              </p>

              {q.resultType === "select" && (
                <div className="space-y-3">
                  {q.optionCounts.map((opt) => (
                    <div key={opt.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-800">{opt.label}</span>
                        <span className="text-sm text-gray-500">
                          {opt.count} ({opt.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {q.otherTexts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Other responses ({q.otherTexts.length})
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {q.otherTexts.map((text, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700"
                          >
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {q.resultType === "text" && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {q.textResponses.length} responses
                  </p>
                  {q.textResponses.length > 0 ? (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {q.textResponses.map((text, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700"
                        >
                          {text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No responses</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {totalResponses === 0 && (
            <p className="text-center text-gray-400 py-8">No responses were submitted.</p>
          )}
        </div>
      </main>
    </div>
  );
}
