"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PollActionsProps {
  poll: { id: string; status: string; mode: string };
}

export default function PollActions({ poll }: PollActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  async function handleActivate() {
    setLoading(true);
    await fetch(`/api/admin/polls/${poll.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    router.refresh();
    setLoading(false);
  }

  async function handleClose() {
    setLoading(true);
    await fetch(`/api/admin/polls/${poll.id}/close`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this poll and all its votes?")) return;
    setLoading(true);
    await fetch(`/api/admin/polls/${poll.id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  async function handleDuplicate() {
    setDuplicating(true);
    await fetch(`/api/admin/polls/${poll.id}/duplicate`, { method: "POST" });
    router.refresh();
    setDuplicating(false);
  }

  function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/poll/${poll.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
      {poll.status === "ACTIVE" && (
        <button
          onClick={handleCopyLink}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            copied
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      )}
      {poll.status === "CLOSED" && (
        <Link
          href={`/poll/${poll.id}/results`}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          View results
        </Link>
      )}
      {(poll.status === "ACTIVE" || poll.status === "CLOSED") && (
        <Link
          href={`/admin/polls/${poll.id}/responses`}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Responses
        </Link>
      )}
      <Link
        href={`/admin/polls/${poll.id}`}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={handleDuplicate}
        disabled={duplicating || loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60 transition-colors"
      >
        {duplicating ? "Duplicating…" : "Duplicate"}
      </button>
      {poll.status === "DRAFT" && (
        <button
          onClick={handleActivate}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition-colors"
        >
          Activate
        </button>
      )}
      {poll.status === "ACTIVE" && (
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
