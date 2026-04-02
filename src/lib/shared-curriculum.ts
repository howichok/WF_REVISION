import {
  CONTENT_RESOURCES,
  CONTENT_SOURCES,
  DSD_CURRICULUM_AREAS,
  DSD_CURRICULUM_POINTS,
  GLOSSARY_TERMS,
  LEGACY_TOPIC_MAPPINGS,
  QUESTION_METADATA,
} from "@/data/curriculum";
import type {
  ContentResource,
  ContentSource,
  CurriculumArea,
  CurriculumPoint,
  GlossaryTerm,
  LegacyTopicMapping,
  QuestionMetadata,
} from "@/data/curriculum";

export interface SharedCurriculumSnapshot {
  origin: "local" | "supabase";
  sources: ContentSource[];
  areas: CurriculumArea[];
  points: CurriculumPoint[];
  terms: GlossaryTerm[];
  resources: ContentResource[];
  questions: QuestionMetadata[];
  legacyTopicMappings: LegacyTopicMapping[];
}

const LOCAL_SHARED_CURRICULUM_SNAPSHOT: SharedCurriculumSnapshot = {
  origin: "local",
  sources: CONTENT_SOURCES,
  areas: DSD_CURRICULUM_AREAS,
  points: DSD_CURRICULUM_POINTS,
  terms: GLOSSARY_TERMS,
  resources: CONTENT_RESOURCES,
  questions: QUESTION_METADATA,
  legacyTopicMappings: LEGACY_TOPIC_MAPPINGS,
};

export function getLocalSharedCurriculumSnapshot(): SharedCurriculumSnapshot {
  return LOCAL_SHARED_CURRICULUM_SNAPSHOT;
}

export function resolveSharedCurriculumSnapshot(
  snapshot?: SharedCurriculumSnapshot | null
) {
  return snapshot ?? LOCAL_SHARED_CURRICULUM_SNAPSHOT;
}
