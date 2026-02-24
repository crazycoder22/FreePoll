import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PollForm from "../PollForm";

export const dynamic = "force-dynamic";

export default async function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!poll) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit poll</h1>
      <PollForm
        poll={{
          id: poll.id,
          title: poll.title,
          description: poll.description ?? "",
          closesAt: poll.closesAt ? poll.closesAt.toISOString().slice(0, 16) : "",
          options: poll.options.map((o) => ({
            label: o.label,
            description: o.description ?? "",
            imageUrl: o.imageUrl ?? "",
          })),
          fields: poll.fields.map((f) => ({
            label: f.label,
            required: f.required,
          })),
        }}
      />
    </div>
  );
}
