import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PollActions from "./PollActions";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default async function DashboardPage() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { votes: true, options: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
        <Link
          href="/admin/polls/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No polls yet.</p>
          <Link href="/admin/polls/new" className="mt-2 inline-block text-blue-600 hover:underline text-sm">
            Create your first poll →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 truncate">{poll.title}</h2>
                  <StatusBadge status={poll.status} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {poll._count.options} options · {poll._count.votes} votes
                  {poll.closesAt && (
                    <span> · closes {new Date(poll.closesAt).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
              <PollActions poll={{ id: poll.id, status: poll.status }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
