"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface OptionDraft {
  label: string;
  description: string;
  imageUrl: string;
}

interface PollDraft {
  id?: string;
  title: string;
  description: string;
  closesAt: string;
  options: OptionDraft[];
}

const emptyOption = (): OptionDraft => ({ label: "", description: "", imageUrl: "" });

export default function PollForm({ poll }: { poll?: PollDraft }) {
  const isEdit = !!poll?.id;
  const router = useRouter();

  const [title, setTitle] = useState(poll?.title ?? "");
  const [description, setDescription] = useState(poll?.description ?? "");
  const [closesAt, setClosesAt] = useState(poll?.closesAt ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    poll?.options && poll.options.length >= 2
      ? poll.options
      : [emptyOption(), emptyOption()]
  );
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index: number, field: keyof OptionDraft, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, emptyOption()]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(index: number, file: File) {
    setUploading(index);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      updateOption(index, "imageUrl", url);
    } else {
      setError("Image upload failed. Please try again.");
    }
    setUploading(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validOptions = options.filter((o) => o.label.trim());
    if (validOptions.length < 2) {
      setError("Please add at least 2 options with labels.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      closesAt: closesAt || null,
      options: validOptions,
    };

    const res = isEdit
      ? await fetch(`/api/admin/polls/${poll!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/polls", {
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
      {/* Poll details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Poll details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Vote for our new company logo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Optional context for voters"
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

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Logo options</h2>
        <p className="text-sm text-gray-500">Add at least 2 options. Each can have an image and a description.</p>

        {options.map((opt, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Option {i + 1}</span>
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOption(i, "label", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Logo A"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={opt.description}
                onChange={(e) => updateOption(i, "description", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Short description for voters"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
              {opt.imageUrl && (
                <div className="mb-2 relative w-32 h-32">
                  <Image
                    src={opt.imageUrl}
                    alt={opt.label || `Option ${i + 1}`}
                    fill
                    className="object-contain rounded-lg border border-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => updateOption(i, "imageUrl", "")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(i, file);
                }}
                className="block text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {uploading === i && (
                <p className="text-xs text-blue-600 mt-1">Uploading…</p>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addOption}
          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          + Add option
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading !== null}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create poll"}
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
