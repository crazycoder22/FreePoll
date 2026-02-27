import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import SurveyResponseForm from "./SurveyResponseForm";

export default async function SurveyPage({
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

  // Auto-close if past deadline
  if (survey.status === "ACTIVE" && survey.closesAt && new Date() > survey.closesAt) {
    await prisma.survey.update({ where: { id }, data: { status: "CLOSED" } });
    survey.status = "CLOSED";
  }

  // Check if voter has already responded
  const cookieStore = await cookies();
  const voterToken = cookieStore.get("fp_voter_token")?.value;
  let hasResponded = false;

  if (voterToken) {
    const response = await prisma.surveyResponse.findUnique({
      where: { surveyId_voterToken: { surveyId: id, voterToken } },
    });
    hasResponded = !!response;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <span className="text-lg font-bold text-gray-900">FreePoll</span>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
          {survey.description && (
            <p className="mt-2 text-gray-500">{survey.description}</p>
          )}
          {survey.closesAt && survey.status === "ACTIVE" && (
            <p className="mt-2 text-sm text-gray-400">
              Closes {new Date(survey.closesAt).toLocaleString()}
            </p>
          )}
        </div>

        {survey.status === "CLOSED" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-blue-800 font-medium">This survey has closed.</p>
            <a
              href={`/survey/${id}/results`}
              className="mt-3 inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View results
            </a>
          </div>
        ) : survey.status === "DRAFT" ? (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            This survey is not open yet.
          </div>
        ) : hasResponded ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-green-800 font-medium text-lg">
              Your response has been recorded!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Results will be visible once the survey closes.
            </p>
          </div>
        ) : (
          <SurveyResponseForm
            surveyId={id}
            questions={survey.questions.map((q) => ({
              id: q.id,
              text: q.text,
              type: q.type as "SINGLE_SELECT" | "FREE_TEXT",
              required: q.required,
              allowOtherText: q.allowOtherText,
              options: q.options.map((o) => ({
                id: o.id,
                label: o.label,
              })),
            }))}
          />
        )}
      </main>
    </div>
  );
}
