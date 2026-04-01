export interface GroundedResearchRequest {
  topicId: string;
  query: string;
}

export interface GroundedResearchSource {
  index: number;
  title: string;
  uri: string;
  host: string;
}

export interface GroundedResearchEvidence {
  id: string;
  snippet: string;
  sourceIndices: number[];
}

export interface GroundedResearchResponse {
  topicId: string;
  topicLabel: string;
  model: string;
  answer: string;
  searchQueries: string[];
  sources: GroundedResearchSource[];
  evidenceTrail: GroundedResearchEvidence[];
  sourceStrategy: string;
}
