import type {
  RevisionAnswerEvaluation,
  RevisionImprovementResponse,
} from "./types";

export type RevisionPredictionBand = "fail" | "merit" | "distinction";

export function getRevisionScorePercent(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}

export function getRevisionPredictionBand(scorePercent: number): RevisionPredictionBand {
  if (scorePercent >= 70) {
    return "distinction";
  }

  if (scorePercent >= 40) {
    return "merit";
  }

  return "fail";
}

export function getPredictionFromRevisionEvaluation(
  evaluation: RevisionAnswerEvaluation
) {
  const scorePercent = getRevisionScorePercent(evaluation.score, evaluation.maxScore);

  return {
    band: getRevisionPredictionBand(scorePercent),
    scorePercent,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
  };
}

export function getPredictionFromRevisionImprove(
  response: RevisionImprovementResponse
) {
  const scorePercent = getRevisionScorePercent(
    response.basedOnScore.score,
    response.basedOnScore.maxScore
  );

  return {
    band: getRevisionPredictionBand(scorePercent),
    scorePercent,
    score: response.basedOnScore.score,
    maxScore: response.basedOnScore.maxScore,
  };
}
