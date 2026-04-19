import { NextResponse } from "next/server";
import { markPlan } from "@/lib/esp/plan-marker";
import { parsePlanXlsx } from "@/lib/esp/excel-template";
import { getEspScenario } from "@/data/esp/scenarios";

export const runtime = "nodejs";
const MAX_BODY = 2_000_000; // 2 MB

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  let scenarioId = "car-sales";
  let rows: { stage: string; owner: string; startWeek: number; endWeek: number; notes?: string }[] = [];
  let rationale: Record<string, string> = {};

  if (contentType.includes("multipart/form-data")) {
    // Uploaded .xlsx
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    scenarioId = (formData.get("scenario") as string | null) ?? "car-sales";
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BODY) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
    const parsed = await parsePlanXlsx(buffer);
    rows = parsed.rows;
    rationale = parsed.rationale;
  } else {
    // JSON from FortuneSheet
    const rawText = await request.text();
    if (rawText.length > MAX_BODY) {
      return NextResponse.json({ error: "Body too large" }, { status: 413 });
    }
    const body = JSON.parse(rawText) as {
      scenario?: string;
      rows?: typeof rows;
      rationale?: Record<string, string>;
    };
    scenarioId = body.scenario ?? "car-sales";
    rows = body.rows ?? [];
    rationale = body.rationale ?? {};
  }

  const scenario = getEspScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }

  const result = await markPlan(
    scenario.title,
    scenario.vocationalContext,
    scenario.planWeeks,
    rows,
    rationale
  );

  return NextResponse.json(result);
}
