import { NextResponse } from "next/server";
import { getRevisionRuntimeHealth } from "@/lib/revision-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getRevisionRuntimeHealth());
}
