"use client";

import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

interface Question {
  id: string;
  text: string;
  type: "SINGLE_SELECT" | "FREE_TEXT";
  required: boolean;
  allowOtherText: boolean;
  options: Option[];
}

interface SurveyResponseFormProps {
  surveyId: string;
  questions: Question[];
}

type AnswerState = {
  optionId: string | null;
  textValue: string;
  isOther: boolean;
};

export default function SurveyResponseForm({
  surveyId,
  questions,
}: SurveyResponseFormProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const initial: Record<string, AnswerState> = {};
    for (const q of questions) {
      initial[q.id] = { optionId: null, textValue: "", isOther: false };
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateAnswer(questionId: string, updates: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...updates },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate required questions
    for (const q of questions) {
      const a = answers[q.id];
      if (!q.required) continue;

      if (q.type === "SINGLE_SELECT") {
        if (!a.optionId && !(a.isOther && a.textValue.trim())) {
          setError(`Please answer: "${q.text}"`);
          return;
        }
      } else if (q.type === "FREE_TEXT") {
        if (!a.textValue.trim()) {
          setError(`Please answer: "${q.text}"`);
          return;
        }
      }
    }

    setSubmitting(true);

    const payload = {
      answers: questions.map((q) => {
        const a = answers[q.id];
        if (q.type === "SINGLE_SELECT") {
          if (a.isOther) {
            return { questionId: q.id, optionId: null, textValue: a.textValue };
          }
          return { questionId: q.id, optionId: a.optionId, textValue: null };
        }
        return { questionId: q.id, optionId: null, textValue: a.textValue };
      }),
    };

    const res = await fetch(`/api/surveys/${surveyId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <p className="text-green-800 font-medium text-lg">
          Your response has been recorded!
        </p>
        <p className="text-green-700 text-sm mt-1">
          Results will be visible once the survey closes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((q, qi) => (
        <div
          key={q.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <p className="font-semibold text-gray-900 mb-1">
            <span className="text-gray-400 text-sm mr-1.5">Q{qi + 1}.</span>
            {q.text}
            {q.required && <span className="text-red-400 ml-1">*</span>}
          </p>

          {q.type === "SINGLE_SELECT" && (
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                    answers[q.id].optionId === opt.id && !answers[q.id].isOther
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id].optionId === opt.id && !answers[q.id].isOther}
                    onChange={() =>
                      updateAnswer(q.id, { optionId: opt.id, isOther: false, textValue: "" })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      answers[q.id].optionId === opt.id && !answers[q.id].isOther
                        ? "border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[q.id].optionId === opt.id && !answers[q.id].isOther && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
              {q.allowOtherText && (
                <label
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                    answers[q.id].isOther
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id].isOther}
                    onChange={() =>
                      updateAnswer(q.id, { optionId: null, isOther: true })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      answers[q.id].isOther ? "border-blue-500" : "border-gray-300"
                    }`}
                  >
                    {answers[q.id].isOther && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-800 mr-2">Other:</span>
                  <input
                    type="text"
                    value={answers[q.id].isOther ? answers[q.id].textValue : ""}
                    onChange={(e) =>
                      updateAnswer(q.id, { textValue: e.target.value })
                    }
                    onFocus={() =>
                      updateAnswer(q.id, { optionId: null, isOther: true })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please specify"
                  />
                </label>
              )}
            </div>
          )}

          {q.type === "FREE_TEXT" && (
            <div className="mt-3">
              <textarea
                value={answers[q.id].textValue}
                onChange={(e) => updateAnswer(q.id, { textValue: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Type your answer here…"
              />
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        {submitting ? "Submitting…" : "Submit response"}
      </button>
    </form>
  );
}
