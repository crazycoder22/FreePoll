import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ResponsesTable from "./ResponsesTable";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
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
      votes: {
        orderBy: { createdAt: "desc" },
        include: {
          option: true,
          voterInfo: { include: { field: true } },
        },
      },
    },
  });

  if (!poll) notFound();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mt-1">
            {poll.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {poll.votes.length} {poll.votes.length === 1 ? "response" : "responses"}
          </p>
        </div>
        {poll.votes.length > 0 && (
          <a
            href={`/api/admin/polls/${id}/export`}
            className="self-start px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Download CSV
          </a>
        )}
      </div>

      {poll.votes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No responses yet.</p>
        </div>
      ) : (
        <ResponsesTable votes={poll.votes} fields={poll.fields} />
      )}
    </div>
  );
}
