import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getEspSourceAssetById, ESP_SOURCE_TASK_ROOT } from "@/data/esp/official-task-sources";

export const runtime = "nodejs";

function mimeForName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\- ()]+/g, "_").slice(0, 180);
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const asset = getEspSourceAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "Unknown asset" }, { status: 404 });
  }

  const baseDir = path.resolve(process.cwd(), ESP_SOURCE_TASK_ROOT);
  const fullPath = path.resolve(baseDir, asset.relativePath);
  const relativeToBase = path.relative(baseDir, fullPath);
  if (relativeToBase.startsWith("..") || path.isAbsolute(relativeToBase)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const buf = await readFile(fullPath);
    const leaf = path.basename(asset.relativePath);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeForName(leaf),
        "Content-Disposition": `attachment; filename="${safeFilename(leaf)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[esp/source-asset]", e);
    return NextResponse.json({ error: "File not found on server" }, { status: 404 });
  }
}
