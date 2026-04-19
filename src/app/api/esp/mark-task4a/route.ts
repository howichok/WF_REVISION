import { NextResponse } from "next/server";
import { getEspScenario } from "@/data/esp/scenarios";
import { parseTask4aDocx } from "@/lib/esp/task4a-parser";
import { imageToText, markTask4a } from "@/lib/esp/task4a-marker";

export const runtime = "nodejs";

const MAX_DOC = 8_000_000;
const MAX_IMG = 4_000_000;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await request.formData();
  const scenarioId = String(form.get("scenario") ?? "car-sales");
  const doc = form.get("document") as File | null;
  if (!doc || typeof doc === "string") {
    return NextResponse.json({ error: "Missing document" }, { status: 400 });
  }

  const buf = Buffer.from(await doc.arrayBuffer());
  if (buf.length > MAX_DOC) {
    return NextResponse.json({ error: "Document too large" }, { status: 413 });
  }

  const scenario = getEspScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }

  const imageFiles = form.getAll("images").filter((f): f is File => f instanceof File);
  const imageDescriptions: string[] = [];

  for (const img of imageFiles) {
    const raw = Buffer.from(await img.arrayBuffer());
    if (raw.length > MAX_IMG) continue;
    const mime = img.type || "image/png";
    const b64 = raw.toString("base64");
    const desc = await imageToText(b64, mime);
    imageDescriptions.push(desc);
  }

  const structure = await parseTask4aDocx(buf, imageDescriptions);
  const mark = await markTask4a(scenario, structure, imageDescriptions);

  return NextResponse.json({ structure, mark });
}
