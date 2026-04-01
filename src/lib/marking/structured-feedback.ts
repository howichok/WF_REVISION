import {
  MIN_FEEDBACK_TOKENS,
  MOSTLY_CORRECT_RATIO,
  STRONG_ANSWER_RATIO,
  THIN_ANSWER_RATIO,
} from "@/lib/marking/thresholds";
import type { CommandWordId } from "@/lib/command-words";
import { getCommandWordById } from "@/lib/command-words";

export interface StructuredFeedbackInput {
  answerTokenCount: number;
  score: number;
  maxScore: number;
  /** Short labels the learner clearly hit (slot labels or concept labels). */
  matchedLabels: string[];
  /** Labels that are only partly covered. */
  partialLabels: string[];
  /** Labels still missing. */
  missingLabels: string[];
  misconceptions?: Array<{ explanation: string }>;
  /** Profile guidance when not yet a strong answer (practice). */
  strongGuidance?: string;
  /** Rubric lines for partial slots (practice). */
  partialDetailLines?: string[];
  /** Rubric lines for missing slots (practice). */
  missingDetailLines?: string[];
  /** Extra praise from matched revision concept rules. */
  matchedConceptPraise?: string[];
  commandWordId?: CommandWordId | null;
  tooShortMessage?: string;
}

function defaultTooShortMessage() {
  return "Your answer is too short to show the main ideas. Add the key concept, explain what it does, and link it to the scenario.";
}

function commandWordDepthHint(id: CommandWordId | null | undefined): string | null {
  if (!id) {
    return null;
  }
  const entry = getCommandWordById(id);
  if (!entry) {
    return null;
  }
  const depthById: Partial<Record<CommandWordId, string>> = {
    discuss:
      "For Discuss, show more than one side, then end with a short balanced conclusion.",
    compare:
      "For Compare, make both similarity and difference clear, ideally in the same structure.",
    evaluate:
      "For Evaluate, weigh pros and cons before you state your judgement.",
    justify:
      "For Justify, lead with your claim, then give linked reasons that support it.",
    analyse:
      "For Analyse, split the scenario into parts and say how each part matters.",
    explain:
      "For Explain, include a because or so that clause so the mechanism is clear.",
  };
  const extra = depthById[id];
  if (extra) {
    return `${extra} (${entry.word}: ${entry.guidance})`;
  }
  return `Command word: ${entry.word} — ${entry.guidance}`;
}

/**
 * Single ordering: (1) level, (2) strengths, (3) gaps, (4) misconceptions, (5) one next-step line.
 */
export function buildStructuredFeedback(input: StructuredFeedbackInput): string {
  const {
    answerTokenCount,
    score,
    maxScore,
    matchedLabels,
    partialLabels,
    missingLabels,
    misconceptions = [],
    strongGuidance,
    partialDetailLines = [],
    missingDetailLines = [],
    matchedConceptPraise = [],
    commandWordId,
    tooShortMessage,
  } = input;

  if (answerTokenCount < MIN_FEEDBACK_TOKENS) {
    return tooShortMessage ?? defaultTooShortMessage();
  }

  const ratio = maxScore > 0 ? score / maxScore : 0;
  const parts: string[] = [];

  if (ratio >= STRONG_ANSWER_RATIO) {
    parts.push("Strong coverage of the main marking points.");
  } else if (ratio >= MOSTLY_CORRECT_RATIO) {
    parts.push("You have most of the right ideas; a few mark-scheme points are still thin or missing.");
  } else if (ratio >= THIN_ANSWER_RATIO) {
    parts.push("You have part of the right idea, but some mark-scheme points are still missing.");
  } else if (score > 0) {
    parts.push("This answer has some correct ideas, but it is still underdeveloped or too thin in places.");
  } else {
    parts.push("The answer only shows limited coverage of the expected concepts.");
  }

  const matchedText = matchedLabels.slice(0, 2).join(" and ");
  if (matchedConceptPraise.length) {
    parts.push(`You clearly covered ${matchedConceptPraise.slice(0, 2).join(" and ")}.`);
  } else if (matchedText) {
    parts.push(`You clearly covered ${matchedText}.`);
  }

  if (partialLabels.length && partialDetailLines.length === 0) {
    parts.push(
      `Develop ${partialLabels.slice(0, 2).join(" and ")} more fully to secure the remaining marks.`
    );
  } else if (partialDetailLines.length) {
    parts.push(partialDetailLines.slice(0, 2).join(" "));
  }

  if (missingLabels.length && missingDetailLines.length === 0) {
    parts.push(
      `Add ${missingLabels.slice(0, 2).join(" and ")} to reach more of the available marks.`
    );
  } else if (missingDetailLines.length) {
    parts.push(missingDetailLines.slice(0, 2).join(" "));
  }

  if (misconceptions.length) {
    parts.push(`Check this misconception: ${misconceptions[0].explanation}`);
  }

  const cmdHint = commandWordDepthHint(commandWordId);
  if (cmdHint) {
    parts.push(cmdHint);
  }

  let nextStep =
    strongGuidance && ratio < STRONG_ANSWER_RATIO ? strongGuidance : "";

  if (!nextStep) {
    if (missingLabels.length) {
      nextStep = `Next try: weave in "${missingLabels[0]}" with one concrete example from the scenario.`;
    } else if (partialLabels.length) {
      nextStep = `Next try: expand "${partialLabels[0]}" with a short cause-and-effect sentence.`;
    } else if (ratio < STRONG_ANSWER_RATIO) {
      nextStep = "Next try: add one more precise technical term and tie it directly to the question stem.";
    }
  }

  if (nextStep) {
    parts.push(nextStep);
  }

  return parts.join(" ");
}
