import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (!poll) notFound();

  if (poll.status !== "CLOSED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results not available yet</h1>
          <p className="text-gray-500">Results are shown once the poll closes.</p>
          <a href={`/poll/${id}`} className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to poll
          </a>
        </div>
      </div>
    );
  }

  const isLiker = poll.mode === "LIKER";

  const voteCounts = await prisma.vote.groupBy({
    by: ["optionId"],
    where: { pollId: id },
    _count: { optionId: true },
  });

  // For LIKER: total = sum of all likes. For POLL: total = number of votes cast.
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

  const winner = results[0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-gray-900">FreePoll</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-3">
            {isLiker ? "❤️ Likes closed" : "Poll closed"}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{poll.title}</h1>
          {poll.description && (
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{poll.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {total} total {isLiker ? "likes" : "votes"}
          </p>
        </div>

        {/* Winner / Most liked highlight — only for POLL mode */}
        {!isLiker && total > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            {winner.imageUrl && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0">
                <Image src={winner.imageUrl} alt={winner.label} fill className="object-contain p-1" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-0.5">Winner</p>
              <p className="text-xl font-bold text-gray-900">{winner.label}</p>
              {winner.description && (
                <p className="text-sm text-gray-500">{winner.description}</p>
              )}
              <p className="text-sm font-medium text-yellow-700 mt-1">
                {winner.votes} votes · {winner.percentage}%
              </p>
            </div>
          </div>
        )}

        {/* Most liked highlight — only for LIKER mode */}
        {isLiker && total > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
            {winner.imageUrl && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0">
                <Image src={winner.imageUrl} alt={winner.label} fill className="object-contain p-1" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                ❤️ Most liked
              </p>
              <p className="text-xl font-bold text-gray-900">{winner.label}</p>
              {winner.description && (
                <p className="text-sm text-gray-500">{winner.description}</p>
              )}
              <p className="text-sm font-medium text-rose-600 mt-1">
                {winner.votes} {winner.votes === 1 ? "like" : "likes"}
              </p>
            </div>
          </div>
        )}

        {/* All results */}
        <div className="space-y-4">
          {results.map((option, i) => (
            <div key={option.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-3">
                {option.imageUrl && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    <Image src={option.imageUrl} alt={option.label} fill className="object-contain p-1" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                    <span className="font-semibold text-gray-900">{option.label}</span>
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-500 truncate">{option.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">{option.percentage}%</p>
                  <p className="text-xs text-gray-400">
                    {option.votes} {isLiker ? (option.votes === 1 ? "like" : "likes") : "votes"}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLiker ? "bg-rose-400" : "bg-blue-500"}`}
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}

          {total === 0 && (
            <p className="text-center text-gray-400 py-8">
              No {isLiker ? "likes" : "votes"} were cast.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
