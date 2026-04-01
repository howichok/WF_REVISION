import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

const allowedRoots = [
  path.join(process.cwd(), "docs", "source-pdfs"),
  path.join(process.cwd(), "docs", "derived"),
];

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") return "application/pdf";
  if (extension === ".md") return "text/markdown; charset=utf-8";
  if (extension === ".csv") return "text/csv; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";

  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const relativePath = request.nextUrl.searchParams.get("path");

  if (!relativePath) {
    return NextResponse.json({ error: "Missing resource path." }, { status: 400 });
  }

  const absolutePath = path.resolve(process.cwd(), relativePath);
  const isAllowed = allowedRoots.some((root) => absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`));

  if (!isAllowed) {
    return NextResponse.json({ error: "Resource path is not allowed." }, { status: 403 });
  }

  try {
    const stats = statSync(absolutePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    const file = readFileSync(absolutePath);

    return new NextResponse(file, {
      headers: {
        "content-type": getContentType(absolutePath),
        "content-disposition": `inline; filename="${path.basename(absolutePath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }
}
