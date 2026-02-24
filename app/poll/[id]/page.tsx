import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import VotingForm from "./VotingForm";

export default async function PollPage({
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

  // Auto-close if past deadline
  if (poll.status === "ACTIVE" && poll.closesAt && new Date() > poll.closesAt) {
    await prisma.poll.update({ where: { id }, data: { status: "CLOSED" } });
    poll.status = "CLOSED";
  }

  // Check if voter has already voted
  const cookieStore = await cookies();
  const voterToken = cookieStore.get("fp_voter_token")?.value;
  let hasVoted = false;
  let votedOptionId: string | null = null;

  if (voterToken) {
    const vote = await prisma.vote.findUnique({
      where: { pollId_voterToken: { pollId: id, voterToken } },
    });
    hasVoted = !!vote;
    votedOptionId = vote?.optionId ?? null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">FreePoll</span>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{poll.title}</h1>
          {poll.description && (
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{poll.description}</p>
          )}
          {poll.closesAt && poll.status === "ACTIVE" && (
            <p className="mt-2 text-sm text-gray-500">
              Closes {new Date(poll.closesAt).toLocaleString()}
            </p>
          )}
        </div>

        {poll.status === "CLOSED" ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-blue-800 font-medium">This poll has closed.</p>
            <a
              href={`/poll/${id}/results`}
              className="mt-3 inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View results
            </a>
          </div>
        ) : poll.status === "DRAFT" ? (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            This poll is not open for voting yet.
          </div>
        ) : (
          <VotingForm
            pollId={id}
            options={poll.options.map((o) => ({
              id: o.id,
              label: o.label,
              description: o.description,
              imageUrl: o.imageUrl,
            }))}
            fields={poll.fields.map((f) => ({
              id: f.id,
              label: f.label,
              required: f.required,
            }))}
            hasVoted={hasVoted}
            votedOptionId={votedOptionId}
          />
        )}
      </main>
    </div>
  );
}
