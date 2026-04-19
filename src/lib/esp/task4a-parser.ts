/**
 * Deterministic Task 4a document structure check (no AI).
 * Expects Heading 2 sections matching the template from docx-templates.
 */
import mammoth from "mammoth";

export const TASK4A_SECTION_TITLES = [
  "Section 1: Feature description",
  "Section 2: Code evidence",
  "Section 3: Test output evidence",
  "Section 4: CSV data used",
  "Section 5: How the feature meets the requirement",
] as const;

export interface Task4aSection {
  name: string;
  text: string;
  hasImage: boolean;
  wordCount: number;
}

export interface Task4aParseResult {
  sections: Task4aSection[];
  missingSections: string[];
  presentSections: string[];
  codeBlocks: string[];
  hasTestOutput: boolean;
  hasCodeEvidence: boolean;
  hasEvaluation: boolean;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionsFromHtml(html: string): { title: string; html: string }[] {
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const headings: { title: string; index: number; matchLen: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    headings.push({
      title: stripTags(m[1] ?? "").replace(/\s+/g, " ").trim(),
      index: m.index,
      matchLen: m[0].length,
    });
  }
  if (headings.length === 0) return [];

  const out: { title: string; html: string }[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!;
    const start = h.index + h.matchLen;
    const end = i + 1 < headings.length ? headings[i + 1]!.index : html.length;
    out.push({ title: h.title, html: html.slice(start, end) });
  }
  return out;
}

function findCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const fence = /```(?:python|py)?\s*([\s\S]*?)```/gi;
  let fm: RegExpExecArray | null;
  while ((fm = fence.exec(text)) !== null) {
    const chunk = fm[1]?.trim();
    if (chunk) blocks.push(chunk);
  }
  if (blocks.length) return blocks;

  const indented = text.match(/(?:^|\n)( {4,}|\t+)(.+)/g);
  if (indented?.length) {
    blocks.push(indented.join("\n"));
  }
  return blocks;
}

function normalizeTitle(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

export async function parseTask4aDocx(buffer: Buffer, imageTexts: string[]): Promise<Task4aParseResult> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const { value: raw } = await mammoth.extractRawText({ buffer });

  const chunks = extractSectionsFromHtml(html);
  const byTitle = new Map<string, { html: string; text: string; hasImage: boolean }>();

  for (const ch of chunks) {
    const key = normalizeTitle(ch.title);
    const text = stripTags(ch.html);
    const hasImage = /<img\s/i.test(ch.html);
    byTitle.set(key, { html: ch.html, text, hasImage });
  }

  const sections: Task4aSection[] = [];
  const presentSections: string[] = [];
  const missingSections: string[] = [];

  for (const title of TASK4A_SECTION_TITLES) {
    const found = byTitle.get(title) ?? byTitle.get(title.replace(/^Section \d+:\s*/i, "").trim());
    let entry = found;
    if (!entry) {
      const loose = chunks.find((c) => normalizeTitle(c.title).includes(title.split(":").pop()?.trim() ?? ""));
      if (loose) {
        entry = {
          html: loose.html,
          text: stripTags(loose.html),
          hasImage: /<img\s/i.test(loose.html),
        };
      }
    }

    if (entry) {
      presentSections.push(title);
      const wc = entry.text.split(/\s+/).filter(Boolean).length;
      sections.push({
        name: title,
        text: entry.text,
        hasImage: entry.hasImage,
        wordCount: wc,
      });
    } else {
      missingSections.push(title);
      sections.push({ name: title, text: "", hasImage: false, wordCount: 0 });
    }
  }

  const fullText = `${raw}\n\n${imageTexts.join("\n\n")}`;
  const codeBlocks = [...findCodeBlocks(fullText), ...findCodeBlocks(html)];

  const codeSection = sections.find((s) => s.name.includes("Code evidence"));
  const testSection = sections.find((s) => s.name.includes("Test output"));
  const evalSection = sections.find((s) => s.name.includes("meets the requirement"));

  const codeText = codeSection?.text ?? "";
  const testText = testSection?.text ?? "";
  const evalText = evalSection?.text ?? "";

  const hasCodeEvidence =
    codeBlocks.length > 0 ||
    /def\s+\w+|import\s+\w+|for\s+\w+\s+in|print\s*\(/i.test(codeText) ||
    (codeSection?.hasImage ?? false);

  const hasTestOutput =
    /pass|fail|expected|actual|assert|traceback|error|output|>>>/i.test(testText + "\n" + imageTexts.join("\n")) ||
    (testSection?.hasImage ?? false);

  const hasEvaluation = evalText.split(/\s+/).filter(Boolean).length >= 12;

  for (const title of TASK4A_SECTION_TITLES) {
    const s = sections.find((x) => x.name === title);
    if (!s) continue;
    const minWords = title.includes("Code") || title.includes("Test") ? 5 : 10;
    const hasContent = s.wordCount >= minWords || s.hasImage;
    if (!hasContent && !missingSections.includes(title)) {
      missingSections.push(`${title} (empty or too short)`);
    }
  }

  return {
    sections,
    missingSections,
    presentSections,
    codeBlocks,
    hasTestOutput,
    hasCodeEvidence,
    hasEvaluation,
  };
}
