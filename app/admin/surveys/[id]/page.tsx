import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SurveyForm from "../SurveyForm";

export default async function EditSurveyPage({
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

  const draft = {
    id: survey.id,
    title: survey.title,
    description: survey.description ?? "",
    closesAt: survey.closesAt
      ? new Date(survey.closesAt).toISOString().slice(0, 16)
      : "",
    status: survey.status,
    questions: survey.questions.map((q) => ({
      text: q.text,
      type: q.type as "SINGLE_SELECT" | "FREE_TEXT",
      required: q.required,
      allowOtherText: q.allowOtherText,
      options: q.options.map((o) => ({ label: o.label })),
    })),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit survey</h1>
      <SurveyForm survey={draft} />
    </div>
  );
}
