import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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
      <div className="flex items-center justify-between mb-6">
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
      </div>

      {poll.votes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No responses yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vote</th>
                  {poll.fields.map((field) => (
                    <th key={field.id} className="text-left px-4 py-3 font-semibold text-gray-600">
                      {field.label}
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {poll.votes.map((vote, i) => (
                  <tr key={vote.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        {vote.option.label}
                      </span>
                    </td>
                    {poll.fields.map((field) => {
                      const info = vote.voterInfo.find((vi) => vi.fieldId === field.id);
                      return (
                        <td key={field.id} className="px-4 py-3 text-gray-700">
                          {info?.value || <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(vote.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
