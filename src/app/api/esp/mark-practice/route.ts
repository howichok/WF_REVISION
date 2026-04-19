import { NextResponse } from "next/server";
import { getEspScenario } from "@/data/esp/scenarios";
import { markPracticeUpload } from "@/lib/esp/mark-practice-core";
import type { EspTask } from "@/data/curriculum";
import { ESP_SLUG_TO_TASK } from "@/data/esp/scenarios/types";

export const runtime = "nodejs";

const MAX_FILE = 6_000_000;

const TASK_SLUGS = new Set(Object.keys(ESP_SLUG_TO_TASK));

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await request.formData();
  const scenarioId = String(form.get("scenario") ?? "car-sales");
  const taskSlug = String(form.get("task") ?? "pre-release");

  const scenario = getEspScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }

  if (!TASK_SLUGS.has(taskSlug)) {
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }

  const task = ESP_SLUG_TO_TASK[taskSlug as keyof typeof ESP_SLUG_TO_TASK];
  if (task === "task_4a") {
    return NextResponse.json({ error: "Use /api/esp/mark-task4a for Task 4a" }, { status: 400 });
  }

  const filesRaw = form.getAll("files");
  const files: { name: string; buffer: Buffer }[] = [];

  for (const entry of filesRaw) {
    if (!(entry instanceof File)) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    if (buffer.length > MAX_FILE) {
      return NextResponse.json({ error: `File ${entry.name} too large` }, { status: 413 });
    }
    files.push({ name: entry.name, buffer });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const mark = await markPracticeUpload(task, scenario, files);
  return NextResponse.json({ mark });
}
