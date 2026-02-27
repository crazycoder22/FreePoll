"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SurveyActionsProps {
  survey: { id: string; status: string };
}

export default function SurveyActions({ survey }: SurveyActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    await fetch(`/api/admin/surveys/${survey.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function handleClose() {
    setLoading(true);
    await fetch(`/api/admin/surveys/${survey.id}/close`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this survey and all its responses?")) return;
    setLoading(true);
    await fetch(`/api/admin/surveys/${survey.id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const surveyUrl = `${origin}/survey/${survey.id}`;

  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      {survey.status === "ACTIVE" && (
        <button
          onClick={() => navigator.clipboard.writeText(surveyUrl)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Copy link
        </button>
      )}
      {survey.status === "CLOSED" && (
        <Link
          href={`/survey/${survey.id}/results`}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          View results
        </Link>
      )}
      <Link
        href={`/admin/surveys/${survey.id}`}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Edit
      </Link>
      {survey.status === "DRAFT" && (
        <button
          onClick={handleActivate}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition-colors"
        >
          Activate
        </button>
      )}
      {survey.status === "ACTIVE" && (
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 transition-colors"
        >
          Close
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
