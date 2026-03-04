import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvCell(value: string): string {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { order: "asc" } },
      votes: {
        orderBy: { createdAt: "asc" },
        include: {
          option: true,
          voterInfo: { include: { field: true } },
        },
      },
    },
  });

  if (!poll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers = ["#", "Vote", ...poll.fields.map((f) => f.label), "Time"];
  const rows = poll.votes.map((vote, i) => {
    const fieldValues = poll.fields.map((field) => {
      const info = vote.voterInfo.find((vi) => vi.fieldId === field.id);
      return csvCell(info?.value ?? "");
    });
    return [
      String(i + 1),
      csvCell(vote.option.label),
      ...fieldValues,
      csvCell(new Date(vote.createdAt).toLocaleString()),
    ].join(",");
  });

  const csv = [headers.map(csvCell).join(","), ...rows].join("\n");
  const filename = `${poll.title.replace(/[^a-z0-9]/gi, "_")}_responses.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
