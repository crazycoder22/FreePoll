"use client";

import { useState } from "react";
import Image from "next/image";

type PollMode = "POLL" | "LIKER";

interface Option {
  id: string;
  label: string;
  description: string | null;
  imageUrl: string | null;
}

interface Field {
  id: string;
  label: string;
  required: boolean;
}

interface VotingFormProps {
  pollId: string;
  mode: PollMode;
  options: Option[];
  fields: Field[];
  hasVoted: boolean;
  votedOptionId: string | null;
  likedOptionIds: string[];
}

export default function VotingForm({
  pollId,
  mode,
  options,
  fields,
  hasVoted: initialHasVoted,
  votedOptionId: initialVotedOptionId,
  likedOptionIds: initialLikedOptionIds,
}: VotingFormProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [votedOptionId] = useState(initialVotedOptionId);
  const [likedOptionIds] = useState<string[]>(initialLikedOptionIds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => Object.fromEntries(fields.map((f) => [f.id, ""]))
  );

  function updateFieldValue(fieldId: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleLike(optionId: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  async function handleSubmit() {
    for (const field of fields) {
      if (field.required && !fieldValues[field.id]?.trim()) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }

    if (mode === "POLL" && !selected) return;
    if (mode === "LIKER" && liked.size === 0) {
      setError("Please heart at least one option before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    const voterInfo: Record<string, string> = {};
    for (const field of fields) {
      const val = fieldValues[field.id]?.trim();
      if (val) voterInfo[field.id] = val;
    }

    const body =
      mode === "LIKER"
        ? { optionIds: Array.from(liked), voterInfo }
        : { optionId: selected, voterInfo };

    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setHasVoted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Already submitted ──────────────────────────────────────────────────────
  if (hasVoted) {
    if (mode === "LIKER") {
      const likedSet = new Set(likedOptionIds);
      return (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
            <p className="text-rose-800 font-medium">
              Thanks! Your {likedSet.size} like{likedSet.size !== 1 ? "s" : ""} have been recorded.
            </p>
            <p className="text-rose-700 text-sm mt-1">
              Results will be visible once the poll closes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                mode="LIKER"
                selected={false}
                liked={likedSet.has(option.id)}
                disabled={true}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      );
    }

    const choice = options.find((o) => o.id === votedOptionId);
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-green-800 font-medium">
            Your vote has been recorded! You voted for <strong>{choice?.label}</strong>.
          </p>
          <p className="text-green-700 text-sm mt-1">
            Results will be visible once the poll closes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              mode="POLL"
              selected={false}
              liked={false}
              voted={option.id === votedOptionId}
              disabled={true}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Voting UI ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {mode === "LIKER" && (
        <p className="text-sm text-gray-500">
          Heart as many options as you like, then submit.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            mode={mode}
            selected={mode === "POLL" && selected === option.id}
            liked={mode === "LIKER" && liked.has(option.id)}
            voted={false}
            disabled={false}
            onClick={() => {
              if (mode === "POLL") setSelected(option.id);
              else toggleLike(option.id);
            }}
          />
        ))}
      </div>

      {fields.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Your information</h3>
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type="text"
                value={fieldValues[field.id] ?? ""}
                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.label}
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={(mode === "POLL" && !selected) || submitting}
        className={`px-8 py-3 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm ${
          mode === "LIKER"
            ? "bg-rose-500 hover:bg-rose-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {submitting
          ? "Submitting…"
          : mode === "LIKER"
          ? `Submit likes${liked.size > 0 ? ` (${liked.size})` : ""}`
          : "Submit vote"}
      </button>
    </div>
  );
}

// ── Heart icon ─────────────────────────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-5 h-5 transition-colors ${filled ? "text-rose-500" : "text-gray-300"}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ── Option card ────────────────────────────────────────────────────────────
function OptionCard({
  option,
  mode,
  selected,
  liked,
  voted,
  disabled,
  onClick,
}: {
  option: Option;
  mode: PollMode;
  selected: boolean;
  liked: boolean;
  voted?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const borderColor =
    mode === "LIKER"
      ? liked
        ? "border-rose-400 bg-rose-50"
        : disabled
        ? "border-gray-100 bg-gray-50 opacity-70"
        : "border-gray-100 bg-white hover:border-rose-200 hover:shadow-sm cursor-pointer"
      : voted
      ? "border-green-400 bg-green-50"
      : selected
      ? "border-blue-500 bg-blue-50"
      : disabled
      ? "border-gray-100 bg-gray-50 opacity-70"
      : "border-gray-100 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-2xl border-2 p-4 transition-all focus:outline-none focus:ring-2 ${
        mode === "LIKER" ? "focus:ring-rose-400" : "focus:ring-blue-400"
      } ${borderColor}`}
    >
      {option.imageUrl && (
        <div className="relative w-full h-48 mb-3 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={option.imageUrl}
            alt={option.label}
            fill
            className="object-contain p-2"
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{option.label}</p>
          {option.description && (
            <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
          )}
        </div>

        {mode === "LIKER" ? (
          <div className={`mt-0.5 shrink-0 p-1 rounded-full transition-colors ${liked ? "bg-rose-100" : ""}`}>
            <HeartIcon filled={liked} />
          </div>
        ) : (
          <div
            className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
              voted
                ? "border-green-500 bg-green-500"
                : selected
                ? "border-blue-500 bg-blue-500"
                : "border-gray-300"
            }`}
          >
            {(selected || voted) && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
