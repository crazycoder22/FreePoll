"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OptionDraft {
  label: string;
}

interface QuestionDraft {
  text: string;
  type: "SINGLE_SELECT" | "FREE_TEXT";
  required: boolean;
  allowOtherText: boolean;
  options: OptionDraft[];
}

interface SurveyDraft {
  id?: string;
  title: string;
  description: string;
  closesAt: string;
  questions: QuestionDraft[];
  status?: string;
}

const emptyOption = (): OptionDraft => ({ label: "" });

const emptyQuestion = (): QuestionDraft => ({
  text: "",
  type: "SINGLE_SELECT",
  required: true,
  allowOtherText: false,
  options: [emptyOption(), emptyOption()],
});

export default function SurveyForm({ survey }: { survey?: SurveyDraft }) {
  const isEdit = !!survey?.id;
  const isLocked = isEdit && survey?.status !== "DRAFT";
  const router = useRouter();

  const [title, setTitle] = useState(survey?.title ?? "");
  const [description, setDescription] = useState(survey?.description ?? "");
  const [closesAt, setClosesAt] = useState(survey?.closesAt ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    survey?.questions && survey.questions.length >= 1
      ? survey.questions
      : [emptyQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateQuestion(index: number, updates: Partial<QuestionDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const updated = { ...q, ...updates };
        // When switching to FREE_TEXT, clear options
        if (updates.type === "FREE_TEXT") {
          updated.options = [];
          updated.allowOtherText = false;
        }
        // When switching to SINGLE_SELECT, add default options
        if (updates.type === "SINGLE_SELECT" && q.type === "FREE_TEXT") {
          updated.options = [emptyOption(), emptyOption()];
        }
        return updated;
      })
    );
  }

  function updateOption(qIndex: number, oIndex: number, label: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex
          ? q
          : {
              ...q,
              options: q.options.map((o, j) =>
                j === oIndex ? { label } : o
              ),
            }
      )
    );
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex ? q : { ...q, options: [...q.options, emptyOption()] }
      )
    );
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex || q.options.length <= 2
          ? q
          : { ...q, options: q.options.filter((_, j) => j !== oIndex) }
      )
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (questions.length < 1) {
      setError("Please add at least 1 question.");
      return;
    }

    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All questions must have text.");
        return;
      }
      if (q.type === "SINGLE_SELECT") {
        const validOpts = q.options.filter((o) => o.label.trim());
        if (validOpts.length < 2) {
          setError(`Question "${q.text}" needs at least 2 options.`);
          return;
        }
      }
    }

    setSaving(true);

    const payload = {
      title,
      description,
      closesAt: closesAt || null,
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        required: q.required,
        allowOtherText: q.allowOtherText,
        options: q.options.filter((o) => o.label.trim()),
      })),
    };

    const res = isEdit
      ? await fetch(`/api/admin/surveys/${survey!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Survey details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Survey details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Sports Gear Survey"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Optional context for respondents"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auto-close date & time (optional)
          </label>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Questions</h2>
        {isLocked && (
          <p className="text-sm text-amber-600">
            Questions cannot be edited after the survey is activated.
          </p>
        )}

        {questions.map((q, qi) => (
          <div key={qi} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Question {qi + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, -1)}
                  disabled={qi === 0 || isLocked}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qi, 1)}
                  disabled={qi === questions.length - 1 || isLocked}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  ↓
                </button>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    disabled={isLocked}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 ml-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Question text *
              </label>
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                disabled={isLocked}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="e.g. How do you currently buy sports gear?"
              />
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(qi, {
                      type: e.target.value as "SINGLE_SELECT" | "FREE_TEXT",
                    })
                  }
                  disabled={isLocked}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="SINGLE_SELECT">Single select</option>
                  <option value="FREE_TEXT">Free text</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(qi, { required: e.target.checked })}
                  disabled={isLocked}
                  className="rounded"
                />
                Required
              </label>
            </div>

            {q.type === "SINGLE_SELECT" && (
              <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      disabled={isLocked}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.options.length > 2 && !isLocked && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + Add option
                  </button>
                )}
                <label className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <input
                    type="checkbox"
                    checked={q.allowOtherText}
                    onChange={(e) =>
                      updateQuestion(qi, { allowOtherText: e.target.checked })
                    }
                    disabled={isLocked}
                    className="rounded"
                  />
                  Allow &quot;Other&quot; free text option
                </label>
              </div>
            )}
          </div>
        ))}

        {!isLocked && (
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            + Add question
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create survey"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
