import { NextResponse } from "next/server";
import { espSourcePublicHref, getEspSourceAssetById } from "@/data/esp/official-task-sources";

export const runtime = "nodejs";

/**
 * Back-compat for bookmarks that still hit ?id=.
 * Assets are static files under `public/esp-official-task/` so they are not
 * bundled into the Netlify serverless handler (avoids oversized Lambda zips).
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const asset = getEspSourceAssetById(id);
  if (!asset) {
    return NextResponse.json({ error: "Unknown asset" }, { status: 404 });
  }

  const url = new URL(espSourcePublicHref(asset.relativePath), request.url);
  return NextResponse.redirect(url, 307);
}
