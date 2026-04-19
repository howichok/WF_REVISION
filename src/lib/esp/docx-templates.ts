/**
 * Server-only Word templates for ESP practice downloads.
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { EspScenario } from "@/data/esp/scenarios/types";
import { TASK4A_SECTION_TITLES } from "@/lib/esp/task4a-parser";

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: level === HeadingLevel.HEADING_1 })],
    spacing: { after: 120 },
  });
}

function body(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: "666666" })],
    spacing: { after: 160 },
  });
}

function para(text: string) {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 120 },
  });
}

export async function generatePreReleaseDocx(scenario: EspScenario): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          heading(`Pre-release brief analysis — ${scenario.title}`, HeadingLevel.HEADING_1),
          body("Complete in Microsoft Word. Upload your finished .docx for feedback."),
          heading("1. Client need (aim)", HeadingLevel.HEADING_2),
          para("(Who benefits? What must improve?)"),
          heading("2. Constraints & risks", HeadingLevel.HEADING_2),
          para("(Deadline, data sensitivity, team limits — from the brief.)"),
          heading("3. Files & data you will use", HeadingLevel.HEADING_2),
          para("(List artefacts provided in the scenario.)"),
          heading("4. Deliverables checklist", HeadingLevel.HEADING_2),
          para("(Plan, defect fix, design, build evidence, evaluation — tick what applies.)"),
          heading("5. Open questions for the team", HeadingLevel.HEADING_2),
          para("(Anything unclear before planning?)"),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}

export async function generateTask2Docx(scenario: EspScenario): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading(`Task 2 — Defect fix & test log (${scenario.title})`, HeadingLevel.HEADING_1),
          body("Paste your corrected Python below. Complete the test log table."),
          heading("Starter code (reference)", HeadingLevel.HEADING_2),
          para(scenario.task2.buggyCode.slice(0, 2000) + (scenario.task2.buggyCode.length > 2000 ? "\n…" : "")),
          heading("Your corrected code", HeadingLevel.HEADING_2),
          para("# Paste full .py here or attach separately and reference filename."),
          heading("Test log", HeadingLevel.HEADING_2),
          para("| Purpose | Input | Expected | Actual | Outcome |"),
          para("| --- | --- | --- | --- | --- |"),
          para("| normal case |  |  |  |  |"),
          para("| boundary |  |  |  |  |"),
          para("| invalid / error |  |  |  |  |"),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}

export async function generateTask3Docx(scenario: EspScenario): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading(`Task 3 — Design (IPO) (${scenario.title})`, HeadingLevel.HEADING_1),
          body(scenario.task3.designPrompt),
          heading("Inputs", HeadingLevel.HEADING_2),
          para("(List inputs and validation rules.)"),
          heading("Process", HeadingLevel.HEADING_2),
          para("(Pseudocode or structured steps — no full IDE code required.)"),
          heading("Outputs", HeadingLevel.HEADING_2),
          para("(What is produced for the user / next stage?)"),
          heading("Data sketch", HeadingLevel.HEADING_2),
          para(`CSV headers: ${scenario.task3.csvHeaders.join(", ")}`),
          para("Sample rows:"),
          ...scenario.task3.csvSampleRows.slice(0, 5).map((row) => para(row.join(" | "))),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}

export async function generateTask4aDocx(scenario: EspScenario): Promise<Buffer> {
  const children: Paragraph[] = [
    heading(`Task 4a — ${scenario.title}`, HeadingLevel.HEADING_1),
    new Paragraph({
      children: [
        new TextRun({ text: "Feature goal: ", bold: true }),
        new TextRun({ text: scenario.task4a.featureHint, italics: true }),
      ],
      spacing: { after: 200 },
    }),
  ];

  for (const title of TASK4A_SECTION_TITLES) {
    children.push(heading(title, HeadingLevel.HEADING_2));
    children.push(para("(Student response area — aim for >10 words per section where applicable.)"));
  }

  const doc = new Document({
    sections: [{ children }],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}

export async function generateTask4bDocx(scenario: EspScenario): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading(`Task 4b — Reflective evaluation (${scenario.title})`, HeadingLevel.HEADING_1),
          body("Link every claim to evidence from Tasks 1–4a."),
          heading("System requirements review", HeadingLevel.HEADING_2),
          ...scenario.task4b.systemRequirements.map((r) => para(`• ${r}\n  Evidence: `)),
          heading("User requirements review", HeadingLevel.HEADING_2),
          ...scenario.task4b.userRequirements.map((r) => para(`• ${r}\n  Evidence: `)),
          heading("Limitations", HeadingLevel.HEADING_2),
          para("(What did not go perfectly? Why?)"),
          heading("Improvements", HeadingLevel.HEADING_2),
          para("(Next steps — no new code here.)"),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
