"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Field {
  id: string;
  label: string;
}

interface Vote {
  id: string;
  createdAt: Date;
  option: { label: string };
  voterInfo: { fieldId: string; value: string }[];
}

interface ResponsesTableProps {
  votes: Vote[];
  fields: Field[];
}

export default function ResponsesTable({ votes, fields }: ResponsesTableProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(voteId: string) {
    if (!confirm("Delete this response?")) return;
    setDeleting(voteId);
    await fetch(`/api/admin/votes/${voteId}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Vote</th>
              {fields.map((field) => (
                <th key={field.id} className="text-left px-4 py-3 font-semibold text-gray-600">
                  {field.label}
                </th>
              ))}
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {votes.map((vote, i) => (
              <tr
                key={vote.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-opacity ${
                  deleting === vote.id ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {vote.option.label}
                  </span>
                </td>
                {fields.map((field) => {
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(vote.id)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Delete response"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
