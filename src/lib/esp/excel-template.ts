/**
 * Server-side: generate a pre-filled Task 1 .xlsx template using ExcelJS.
 * Also parse an uploaded .xlsx back into structured rows.
 */
import ExcelJS from "exceljs";
import type { EspScenario } from "@/data/esp/scenarios/types";

const GREEN = "FF21A366";
const GREEN_LIGHT = "FFE8F3ED";
const GREEN_PALE = "FFEEFDF4";
const HEADER_FONT_COLOR = "FF0B6937";
const MUTED = "FF605E5C";
const YELLOW_HINT = "FFFFF8DC";

function style(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  opts: {
    value?: string | number | null;
    bold?: boolean;
    bgHex?: string;
    fontHex?: string;
    align?: "left" | "center" | "right";
    wrap?: boolean;
    size?: number;
  }
) {
  const cell = ws.getCell(row, col);
  if (opts.value !== undefined) cell.value = opts.value ?? null;
  cell.font = {
    bold: opts.bold ?? false,
    color: { argb: opts.fontHex ?? "FF1F1F1F" },
    size: opts.size ?? 10,
    name: "Calibri",
  };
  if (opts.bgHex) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.bgHex } };
  }
  cell.alignment = {
    horizontal: opts.align ?? "left",
    vertical: "middle",
    wrapText: opts.wrap ?? false,
  };
  cell.border = {
    top: { style: "thin", color: { argb: "FFDDDDDD" } },
    bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
    left: { style: "thin", color: { argb: "FFDDDDDD" } },
    right: { style: "thin", color: { argb: "FFDDDDDD" } },
  };
}

export async function generatePlanXlsx(scenario: EspScenario): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "WF Revision";
  wb.created = new Date();

  // ── Sheet 1: Schedule ────────────────────────────────────────────
  const ws = wb.addWorksheet("Schedule", { views: [{ state: "frozen", ySplit: 2 }] });

  ws.getRow(1).height = 30;
  ws.getRow(2).height = 24;

  // Title
  ws.mergeCells(1, 1, 1, 4 + scenario.planWeeks + 2);
  style(ws, 1, 1, {
    value: `${scenario.title} — Project Plan (Task 1)`,
    bold: true,
    bgHex: GREEN,
    fontHex: "FFFFFFFF",
    size: 14,
  });

  // Header row
  const fixedHeaders = ["Stage", "Owner", "Start week", "End week"];
  fixedHeaders.forEach((h, i) => {
    style(ws, 2, i + 1, { value: h, bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR, align: "center" });
  });
  for (let w = 1; w <= scenario.planWeeks; w++) {
    style(ws, 2, 4 + w, { value: `W${w}`, bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR, align: "center" });
  }
  style(ws, 2, 4 + scenario.planWeeks + 1, { value: "Cost (£)", bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR, align: "right" });
  style(ws, 2, 4 + scenario.planWeeks + 2, { value: "Notes / rationale", bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR });

  // Data rows
  scenario.suggestedStages.forEach((stage, idx) => {
    const row = idx + 3;
    const role = scenario.roles[idx % scenario.roles.length]!;
    const start = Math.min(idx + 1, scenario.planWeeks);
    const end = Math.min(idx + 2, scenario.planWeeks);
    ws.getRow(row).height = 28;

    style(ws, row, 1, { value: stage, bold: true, bgHex: "FFF8F6F4" });
    style(ws, row, 2, { value: role.label });
    style(ws, row, 3, { value: start, align: "center" });
    style(ws, row, 4, { value: end, align: "center" });

    for (let w = 1; w <= scenario.planWeeks; w++) {
      const inBar = w >= start && w <= end;
      if (inBar) {
        style(ws, row, 4 + w, { value: "", bgHex: GREEN });
      } else {
        style(ws, row, 4 + w, { value: "" });
      }
    }
    style(ws, row, 4 + scenario.planWeeks + 1, {
      value: role.dayRateGbp * 5,
      bgHex: GREEN_PALE,
      fontHex: HEADER_FONT_COLOR,
      align: "right",
    });
    style(ws, row, 4 + scenario.planWeeks + 2, {
      value: "← type your notes here",
      fontHex: MUTED,
      bgHex: YELLOW_HINT,
    });
  });

  // Total row
  const totalRow = scenario.suggestedStages.length + 3;
  style(ws, totalRow, 1, { value: "TOTAL", bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR });
  style(ws, totalRow, 4 + scenario.planWeeks + 1, {
    value: scenario.roles.reduce((s, r) => s + r.dayRateGbp * 5, 0),
    bold: true,
    bgHex: GREEN_LIGHT,
    fontHex: HEADER_FONT_COLOR,
    align: "right",
  });

  // Rationale section
  const rRow = totalRow + 2;
  ws.mergeCells(rRow, 1, rRow, 4 + scenario.planWeeks + 2);
  style(ws, rRow, 1, { value: "RATIONALE — write your justification below (one row per point)", bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR });

  const rationalePrompts = [
    ["Sequencing:", "Why are the stages in this order?"],
    ["Dependencies:", "Which stages must finish before another starts?"],
    ["Staff allocation:", "Why are these roles assigned to these stages?"],
    ["Testing:", "When and how will testing happen?"],
    ["Risks:", "What could go wrong? How will it be managed?"],
    ["Cost impact:", "Is the budget realistic? Justify trade-offs."],
  ];
  rationalePrompts.forEach(([label, prompt], i) => {
    const r = rRow + 1 + i;
    ws.getRow(r).height = 32;
    style(ws, r, 1, { value: label, bold: true, bgHex: GREEN_PALE, fontHex: HEADER_FONT_COLOR });
    ws.mergeCells(r, 2, r, 4 + scenario.planWeeks + 2);
    style(ws, r, 2, { value: prompt, fontHex: MUTED, bgHex: YELLOW_HINT, wrap: true });
  });

  // Column widths
  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 11;
  ws.getColumn(4).width = 11;
  for (let w = 1; w <= scenario.planWeeks; w++) ws.getColumn(4 + w).width = 6;
  ws.getColumn(4 + scenario.planWeeks + 1).width = 12;
  ws.getColumn(4 + scenario.planWeeks + 2).width = 40;

  // ── Sheet 2: Cost plan ───────────────────────────────────────────
  const wc = wb.addWorksheet("Cost plan");
  ["Activity", "Role", "Days", "Day rate (£)", "Subtotal (£)"].forEach((h, i) => {
    style(wc, 1, i + 1, { value: h, bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR, align: i > 1 ? "right" : "left" });
  });
  scenario.roles.forEach((role, i) => {
    style(wc, i + 2, 1, { value: `Sprint — ${role.label}` });
    style(wc, i + 2, 2, { value: role.label });
    style(wc, i + 2, 3, { value: 5, align: "right" });
    style(wc, i + 2, 4, { value: role.dayRateGbp, align: "right" });
    style(wc, i + 2, 5, { value: role.dayRateGbp * 5, bgHex: GREEN_PALE, fontHex: HEADER_FONT_COLOR, align: "right" });
  });
  [1, 2, 3, 4, 5].forEach((w) => (wc.getColumn(w).width = [28, 18, 10, 14, 14][w - 1]!));

  // ── Sheet 3: Rationale (standalone) ─────────────────────────────
  const wr = wb.addWorksheet("Rationale");
  [
    ["Point", "Your justification"],
    ["Sequencing", ""],
    ["Dependencies", ""],
    ["Staff / roles", ""],
    ["Testing", ""],
    ["Risks", ""],
    ["Cost trade-offs", ""],
    ["Why feasible for this client", ""],
  ].forEach(([a, b], i) => {
    if (i === 0) {
      style(wr, 1, 1, { value: a, bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR });
      style(wr, 1, 2, { value: b, bold: true, bgHex: GREEN_LIGHT, fontHex: HEADER_FONT_COLOR });
    } else {
      wr.getRow(i + 1).height = 40;
      style(wr, i + 1, 1, { value: a, bold: true, bgHex: GREEN_PALE, fontHex: HEADER_FONT_COLOR });
      style(wr, i + 1, 2, { value: b ?? "", bgHex: YELLOW_HINT, wrap: true });
    }
  });
  wr.getColumn(1).width = 26;
  wr.getColumn(2).width = 70;

  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw);
}

export interface ParsedPlanRow {
  stage: string;
  owner: string;
  startWeek: number;
  endWeek: number;
  cost: number;
  notes: string;
}

export interface ParsedPlan {
  rows: ParsedPlanRow[];
  rationale: Record<string, string>;
}

/** Parse an uploaded .xlsx back into structured rows for AI marking. */
export async function parsePlanXlsx(buffer: Buffer): Promise<ParsedPlan> {
  const wb = new ExcelJS.Workbook();
  // exceljs typings target a legacy `Buffer` shape; runtime accepts standard buffers.
  await wb.xlsx.load(buffer as never);

  const ws = wb.getWorksheet("Schedule") ?? wb.worksheets[0];
  const rows: ParsedPlanRow[] = [];

  if (ws) {
    ws.eachRow((row, rowNum) => {
      if (rowNum < 3) return; // skip title + header
      const a = row.getCell(1).text?.trim();
      if (!a || a === "TOTAL" || a.includes("RATIONALE")) return;
      rows.push({
        stage: a,
        owner: row.getCell(2).text?.trim() ?? "",
        startWeek: Number(row.getCell(3).value) || 0,
        endWeek: Number(row.getCell(4).value) || 0,
        cost: Number(row.getCell(5).value) || 0,
        notes: row.getCell(row.cellCount).text?.trim() ?? "",
      });
    });
  }

  const wr = wb.getWorksheet("Rationale") ?? wb.getWorksheet("Schedule");
  const rationale: Record<string, string> = {};
  if (wr) {
    wr.eachRow((row) => {
      const a = row.getCell(1).text?.trim();
      const b = row.getCell(2).text?.trim();
      if (a && b && a !== "Point") rationale[a] = b;
    });
  }

  return { rows, rationale };
}
