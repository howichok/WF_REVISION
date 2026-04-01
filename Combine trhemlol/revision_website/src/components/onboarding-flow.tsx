"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Compass,
  Map,
  Sparkles,
  Target,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useProgress } from "@/components/providers/progress-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  buildLearnerPersonalisation,
  buildOnboardingAssessmentQuestions,
  createEmptyLearnerProfile,
  getPaperLabel,
} from "@/lib/domain/personalisation";
import type {
  LearnerProfileState,
  LibraryResource,
  PaperType,
  Question,
  Topic,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const PAPER_ORDER: PaperType[] = ["paper-1", "paper-2", "esp", "os"];
const STEP_LABELS = ["Survey", "Assess skills", "Knowledge map"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryCard({
  title,
  tone,
  items,
  emptyLabel,
}: {
  title: string;
  tone: "blue" | "orange" | "green";
  items: Array<{ title: string; detail: string }>;
  emptyLabel: string;
}) {
  const tones = {
    blue: "bg-[#edf4fd] text-[#2f69b5]",
    orange: "bg-[#fff0e4] text-[#c1651b]",
    green: "bg-[#edf7ef] text-[#4b8f60]",
  };

  return (
    <div className="rounded-[1.45rem] border border-[#ddd5ca] bg-white/76 p-4 shadow-[0_18px_30px_-28px_rgba(15,35,72,0.45)]">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}-${item.title}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6ddd2] bg-white/75 px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", tones[tone])}>
                  <CircleDot className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#ddd5ca] bg-white/65 px-3 py-4 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function KnowledgeMapColumn({
  paper,
  items,
}: {
  paper: PaperType;
  items: Array<{
    topicId: string;
    title: string;
    score: number;
    manualWeak: boolean;
    detail: string;
  }>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#ddd5ca] bg-white/76 p-4 shadow-[0_18px_30px_-28px_rgba(15,35,72,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f69b5]">{getPaperLabel(paper)}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">Topic map</h3>
        </div>
        <span className="rounded-full bg-[#edf4fd] px-3 py-1 text-xs font-semibold text-[#2f69b5]">{items.length} topics</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const barClass =
            item.score >= 72 ? "bg-[#4b8f60]" : item.score >= 52 ? "bg-[#2f69b5]" : "bg-[#d97b2f]";

          return (
            <div key={item.topicId} className="rounded-[1.1rem] border border-[#ebe2d8] bg-[#fcfaf7] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <span className="text-xs font-semibold text-slate-500">{Math.round(item.score)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#e8e0d6]">
                <div className={cn("h-2 rounded-full", barClass)} style={{ width: `${Math.max(10, item.score)}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
              {item.manualWeak ? (
                <span className="mt-2 inline-flex rounded-full bg-[#fff0e4] px-2.5 py-1 text-[11px] font-semibold text-[#c1651b]">
                  Marked as weak
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingFlow({
  topics,
  questions,
  resources,
}: {
  topics: Topic[];
  questions: Question[];
  resources: LibraryResource[];
}) {
  const auth = useAuth();
  const progress = useProgress();
  const router = useRouter();
  const [profile, setProfile] = useState<LearnerProfileState | null>(auth.currentUser?.profile ?? null);

  useEffect(() => {
    setProfile(auth.currentUser?.profile ?? null);
  }, [auth.currentUser]);

  if (!auth.currentUser || !profile) {
    return null;
  }

  const selectedPapers = profile.selectedPapers;
  const activePapers = selectedPapers.length > 0 ? selectedPapers : PAPER_ORDER;
  const selectedTopics = topics.filter((topic) => activePapers.includes(topic.paper));
  const groupedTopics = PAPER_ORDER.filter((paper) => activePapers.includes(paper)).map((paper) => ({
    paper,
    topics: selectedTopics.filter((topic) => topic.paper === paper),
  }));

  const assessmentQuestions = buildOnboardingAssessmentQuestions(
    topics,
    questions,
    selectedPapers,
    profile.weakTopicIds,
  );
  const answeredCount = profile.assessmentAnswers.filter((answer) =>
    assessmentQuestions.some((question) => question.id === answer.questionId),
  ).length;
  const activeAssessmentQuestion = assessmentQuestions.find(
    (question) => !profile.assessmentAnswers.some((answer) => answer.questionId === question.id),
  );
  const personalisation = buildLearnerPersonalisation(topics, questions, progress, profile);
  const weakSelectionCount = profile.weakTopicIds.length + profile.weakSubtopicIds.length;
  const miniTestComplete = assessmentQuestions.length > 0 && answeredCount >= assessmentQuestions.length;
  const currentStepIndex = miniTestComplete ? 2 : selectedPapers.length > 0 || weakSelectionCount > 0 ? 1 : 0;
  const setupPercent = miniTestComplete
    ? 100
    : Math.round(
        (((selectedPapers.length > 0 ? 1 : 0) +
          (weakSelectionCount > 0 ? 1 : 0) +
          answeredCount / Math.max(assessmentQuestions.length, 1)) /
          3) *
          100,
      );
  const knowledgeMapColumns = PAPER_ORDER.filter((paper) => activePapers.includes(paper)).map((paper) => ({
    paper,
    items: personalisation.priorities
      .filter((signal) => signal.paper === paper)
      .concat(personalisation.strengths.filter((signal) => signal.paper === paper))
      .slice(0, 4)
      .reduce<Array<{ topicId: string; title: string; score: number; manualWeak: boolean; detail: string }>>(
        (accumulator, signal) => {
          if (accumulator.some((item) => item.topicId === signal.topicId)) return accumulator;

          accumulator.push({
            topicId: signal.topicId,
            title: signal.title,
            score: signal.score,
            manualWeak: signal.manualWeak,
            detail: signal.drivers[0] ?? "Awaiting more evidence.",
          });

          return accumulator;
        },
        [],
      ),
  }));

  function saveProfile(nextProfile: LearnerProfileState) {
    setProfile(nextProfile);
    auth.saveProfile(nextProfile);
  }

  function updateProfile(updater: (current: LearnerProfileState) => LearnerProfileState) {
    if (!profile) return;
    saveProfile(updater(profile));
  }

  function handleSelectPaper(paper: PaperType) {
    updateProfile((current) => {
      const selected = current.selectedPapers.includes(paper)
        ? current.selectedPapers.filter((value) => value !== paper)
        : [...current.selectedPapers, paper];
      const nextPapers = PAPER_ORDER.filter((value) => selected.includes(value));
      const allowedTopicIds = new Set(topics.filter((topic) => nextPapers.includes(topic.paper)).map((topic) => topic.id));
      const allowedSubtopicIds = new Set(
        topics
          .filter((topic) => nextPapers.includes(topic.paper))
          .flatMap((topic) => topic.subtopics.map((subtopic) => subtopic.id)),
      );

      return {
        ...current,
        onboardingStep: Math.max(current.onboardingStep, 0),
        selectedPapers: nextPapers,
        studyPath: nextPapers.length === 1 ? nextPapers[0] : "mixed",
        weakTopicIds: current.weakTopicIds.filter((topicId) => allowedTopicIds.has(topicId)),
        weakSubtopicIds: current.weakSubtopicIds.filter((subtopicId) => allowedSubtopicIds.has(subtopicId)),
        assessmentAnswers: [],
      };
    });
  }

  function handleSelectMixedPath() {
    updateProfile((current) => ({
      ...current,
      onboardingStep: Math.max(current.onboardingStep, 0),
      selectedPapers: PAPER_ORDER,
      studyPath: "mixed",
      assessmentAnswers: [],
    }));
  }

  function toggleWeakTopic(topicId: string) {
    updateProfile((current) => ({
      ...current,
      onboardingStep: Math.max(current.onboardingStep, 0),
      weakTopicIds: current.weakTopicIds.includes(topicId)
        ? current.weakTopicIds.filter((value) => value !== topicId)
        : [...current.weakTopicIds, topicId],
      assessmentAnswers: [],
    }));
  }

  function toggleWeakSubtopic(subtopicId: string) {
    updateProfile((current) => ({
      ...current,
      onboardingStep: Math.max(current.onboardingStep, 0),
      weakSubtopicIds: current.weakSubtopicIds.includes(subtopicId)
        ? current.weakSubtopicIds.filter((value) => value !== subtopicId)
        : [...current.weakSubtopicIds, subtopicId],
      assessmentAnswers: [],
    }));
  }

  function answerAssessment(optionId: string) {
    if (!profile || !activeAssessmentQuestion) return;
    const selectedOption = activeAssessmentQuestion.options.find((option) => option.id === optionId);
    if (!selectedOption) return;

    const nextAnswers = profile.assessmentAnswers.filter(
      (answer) => answer.questionId !== activeAssessmentQuestion.id,
    );

    saveProfile({
      ...profile,
      onboardingStep: 1,
      assessmentAnswers: [
        ...nextAnswers,
        {
          questionId: activeAssessmentQuestion.id,
          topicId: activeAssessmentQuestion.topicId,
          paper: activeAssessmentQuestion.paper,
          selectedOptionId: selectedOption.id,
          isCorrect: selectedOption.isCorrect,
          answeredAt: new Date().toISOString(),
        },
      ],
    });
  }

  function handleResetProfile() {
    saveProfile(createEmptyLearnerProfile(profile?.onboardingStartedAt ?? new Date().toISOString()));
  }

  function handleOpenRevision() {
    if (!profile) return;
    const completedProfile: LearnerProfileState = {
      ...profile,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingStep: 2,
    };

    saveProfile(completedProfile);
    router.push("/revision");
  }

  const strengthItems = personalisation.strengths.slice(0, 3).map((signal) => ({
    title: signal.title,
    detail: `${getPaperLabel(signal.paper)} - ${Math.round(signal.score)}% confidence`,
  }));
  const weakItems = personalisation.weakAreas.slice(0, 3).map((signal) => ({
    title: signal.title,
    detail: signal.drivers[0] ?? "Needs more evidence.",
  }));
  const focusItems = personalisation.priorities.slice(0, 3).map((signal) => ({
    title: signal.title,
    detail: signal.drivers[0] ?? "Priority area.",
  }));
  const nextExamLabel = personalisation.upcomingExam
    ? `${personalisation.upcomingExam.title} on ${formatDate(personalisation.upcomingExam.examDate)}`
    : "Choose a study path to load the next assessment.";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-24">
      <section className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed]/95 p-6 shadow-[0_30px_70px_-44px_rgba(15,35,72,0.5)]">
        <div className="flex flex-col gap-5 border-b border-[#e4dbd0] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <BrandMark />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#2f69b5]">Setup</p>
            <h1 className="mt-2 text-[2.6rem] font-semibold tracking-tight text-slate-900">Hello, {auth.currentUser.username}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Choose what you want to study, mark weak areas, complete the mini topic check, and let the platform
              build your first knowledge map before Revision opens.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {STEP_LABELS.map((label, index) => (
              <span
                key={label}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  index === currentStepIndex
                    ? "bg-[#2f69b5] text-white shadow-[0_14px_24px_-18px_rgba(47,105,181,0.85)]"
                    : index < currentStepIndex
                      ? "bg-[#edf4fd] text-[#2f69b5]"
                      : "bg-white/72 text-slate-500",
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Setup progress</p>
            <p className="mt-1 text-sm text-slate-500">
              Survey, mini test, then a knowledge map tied to your next assessment.
            </p>
          </div>
          <div className="w-full max-w-[22rem]">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
              <span>Progress</span>
              <span>{setupPercent}%</span>
            </div>
            <ProgressBar percent={setupPercent} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(24,69,126,0.98),rgba(17,53,98,0.98))] p-7 text-white shadow-[0_32px_64px_-42px_rgba(7,29,64,0.75)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">Survey</p>
            <h2 className="mt-3 text-[2.3rem] font-semibold tracking-tight">What do you want to study?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50">
              Pick one paper or build a mixed route. Your choices control the topic survey, mini test coverage, and
              the exam countdown that appears in Revision.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {PAPER_ORDER.map((paper) => {
                const active = selectedPapers.includes(paper);

                return (
                  <button
                    key={paper}
                    type="button"
                    onClick={() => handleSelectPaper(paper)}
                    className={cn(
                      "flex items-center justify-between rounded-[1rem] border px-4 py-3 text-left text-sm font-semibold transition",
                      active
                        ? "border-[#ffffff55] bg-white text-slate-800 shadow-[0_14px_30px_-22px_rgba(255,255,255,0.65)]"
                        : "border-[#4d78b1] bg-white/12 text-white hover:bg-white/18",
                    )}
                  >
                    <span>{getPaperLabel(paper)}</span>
                    <ChevronRight className={cn("h-4 w-4", active ? "text-slate-400" : "text-blue-100")} />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleSelectMixedPath}
                className={cn(
                  "flex items-center justify-between rounded-[1rem] border px-4 py-3 text-left text-sm font-semibold transition sm:col-span-2",
                  selectedPapers.length === PAPER_ORDER.length
                    ? "border-[#ffffff55] bg-white text-slate-800 shadow-[0_14px_30px_-22px_rgba(255,255,255,0.65)]"
                    : "border-[#4d78b1] bg-white/12 text-white hover:bg-white/18",
                )}
              >
                <span>Mixed Path</span>
                <ChevronRight className={cn("h-4 w-4", selectedPapers.length === PAPER_ORDER.length ? "text-slate-400" : "text-blue-100")} />
              </button>
            </div>
          </Card>

          <Card className="bg-white/75 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
                  <Target className="h-4 w-4" />
                  Weak areas
                </div>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900">Mark the topics that already feel weak.</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  This is the self-declared part of setup. Then the mini test adds scored evidence on top so the
                  knowledge map is not based on guesses alone.
                </p>
              </div>
              <span className="rounded-full bg-[#fff0e4] px-4 py-2 text-sm font-semibold text-[#c1651b]">
                {weakSelectionCount} selected
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {groupedTopics.map((group) => (
                <div key={group.paper} className="rounded-[1.35rem] border border-[#e4dbd0] bg-[#fcfaf7] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f69b5]">{getPaperLabel(group.paper)}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">Topics</h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{group.topics.length} available</span>
                  </div>

                  <div className="mt-4 space-y-4">
                    {group.topics.map((topic) => {
                      const topicSelected = profile.weakTopicIds.includes(topic.id);

                      return (
                        <div key={topic.id} className="rounded-[1.15rem] border border-[#e8dfd4] bg-white/80 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-slate-900">{topic.title}</h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{topic.summary}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleWeakTopic(topic.id)}
                              className={cn(
                                "rounded-full px-4 py-2 text-sm font-semibold transition",
                                topicSelected
                                  ? "bg-[#faece8] text-[#b45847]"
                                  : "bg-[#edf4fd] text-[#2f69b5] hover:bg-[#dfeaf8]",
                              )}
                            >
                              {topicSelected ? "Marked weak" : "Mark topic"}
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {topic.subtopics.map((subtopic) => {
                              const active = profile.weakSubtopicIds.includes(subtopic.id);

                              return (
                                <button
                                  key={subtopic.id}
                                  type="button"
                                  onClick={() => toggleWeakSubtopic(subtopic.id)}
                                  className={cn(
                                    "rounded-full border px-3 py-2 text-sm transition",
                                    active
                                      ? "border-[#efc2b8] bg-[#faece8] text-[#b45847]"
                                      : "border-[#ddd5ca] bg-white/80 text-slate-600 hover:bg-[#f4eee6]",
                                  )}
                                >
                                  {subtopic.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white/75 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
                  <BrainCircuit className="h-4 w-4" />
                  Assess skills
                </div>
                <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900">Mini test across your selected topics.</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  This is a short skill check, not a full quiz. It samples topics across your chosen path so the first
                  knowledge map can separate stronger areas from weaker ones before Revision opens.
                </p>
              </div>
              <span className="rounded-full bg-[#edf4fd] px-4 py-2 text-sm font-semibold text-[#2f69b5]">
                {answeredCount}/{assessmentQuestions.length}
              </span>
            </div>

            {activeAssessmentQuestion ? (
              <div className="mt-5 rounded-[1.35rem] border border-[#e4dbd0] bg-[#fcfaf7] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {activeAssessmentQuestion.supportLabel}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{activeAssessmentQuestion.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{activeAssessmentQuestion.prompt}</p>

                <div className="mt-5 grid gap-3">
                  {activeAssessmentQuestion.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => answerAssessment(option.id)}
                      className="app-list-row w-full text-left text-sm text-slate-700 hover:bg-[#f8fbff]"
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-[#2f69b5]" />
                        <span>{option.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.35rem] border border-[#d4e5cb] bg-[#edf7ef] p-5 text-sm leading-6 text-[#487856]">
                The mini test is complete. Your knowledge map is ready below, built from your selected route, weak
                areas, and quick topic answers.
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-white/75 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
              <Compass className="h-4 w-4" />
              Setup summary
            </div>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-900">What the platform has so far</h2>

            <div className="mt-5 space-y-3">
              {[
                {
                  title: selectedPapers.length > 0 ? "Study path selected" : "Choose a study path",
                  detail:
                    selectedPapers.length > 0
                      ? activePapers.map((paper) => getPaperLabel(paper)).join(", ")
                      : "Pick one paper or a mixed route before the knowledge map is finalised.",
                },
                {
                  title: weakSelectionCount > 0 ? "Weak areas captured" : "Mark weak areas",
                  detail:
                    weakSelectionCount > 0
                      ? `${weakSelectionCount} weak topic signals will affect the first map.`
                      : "Select the topics or subtopics you already know need attention.",
                },
                {
                  title: `Mini test progress ${answeredCount}/${assessmentQuestions.length}`,
                  detail:
                    answeredCount > 0
                      ? "Each answer gives the first evidence for your strengths, weak areas, and focus order."
                      : "The mini test samples your route so Revision does not open as a generic dashboard.",
                },
              ].map((item, index) => (
                <div key={item.title} className="app-list-row">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf4fd] text-xs font-bold text-[#2f69b5]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-[#e4dbd0] bg-white/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
                <CalendarDays className="h-4 w-4" />
                Next exam
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{nextExamLabel}</p>
              {personalisation.upcomingExam ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {personalisation.upcomingExam.daysUntil} days to go. Cover{" "}
                  {personalisation.upcomingExam.topicsToCover} topic areas before this point.
                </p>
              ) : null}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-[#e4dbd0] bg-white/80 p-4">
              <p className="text-sm font-semibold text-slate-900">Resources ready after setup</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {resources.length} resources are already indexed for Library, so the knowledge map can send the learner
                into Revision or Library without changing context.
              </p>
            </div>
          </Card>

          <Card className="bg-white/75 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
              <Map className="h-4 w-4" />
              Live preview
            </div>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-900">Your first map is already taking shape.</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              The cards below update as soon as you choose a route, flag weak areas, and answer the mini topic check.
            </p>

            <div className="mt-5 space-y-4">
              <SummaryCard
                title="Strengths"
                tone="blue"
                items={strengthItems}
                emptyLabel="Strength signals appear here once the first answers are in."
              />
              <SummaryCard
                title="Weak areas"
                tone="orange"
                items={weakItems}
                emptyLabel="Weak areas will be ranked here using both survey and mini test evidence."
              />
              <SummaryCard
                title="Focus first"
                tone="green"
                items={focusItems}
                emptyLabel="The first focus order appears here after the platform can compare your signals."
              />
            </div>
          </Card>

          <Card className="bg-white/75 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
              <Sparkles className="h-4 w-4" />
              Continue
            </div>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-900">
              {miniTestComplete ? "Your knowledge map is ready." : "Finish the setup flow."}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {miniTestComplete
                ? "Open Revision with a personalised dashboard instead of a generic landing page."
                : "Revision opens after the survey and mini test have created a real starting profile."}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleOpenRevision}
                disabled={!miniTestComplete}
                className="app-button-orange w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                Open Revision
                <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleResetProfile} className="app-button-muted w-full">
                Reset setup answers
              </button>
            </div>
          </Card>
        </div>
      </section>

      {miniTestComplete ? (
        <section className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed]/95 p-6 shadow-[0_30px_70px_-44px_rgba(15,35,72,0.5)]">
          <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-[1.55rem] bg-[linear-gradient(135deg,#6e9bdd,#2f69b5)] px-5 py-6 text-white shadow-[0_28px_48px_-34px_rgba(47,105,181,0.8)]">
              <div className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Knowledge map</p>
                  <h2 className="mt-2 text-[2.2rem] font-semibold tracking-tight">Your study profile is now live.</h2>
                  <p className="mt-3 text-sm leading-7 text-blue-50">
                    {personalisation.upcomingExam
                      ? `${personalisation.upcomingExam.title} is your next major deadline on ${formatDate(personalisation.upcomingExam.examDate)}.`
                      : "Your first Revision workspace is now based on the setup you just completed."}
                  </p>
                  <p className="mt-2 text-sm text-blue-100">
                    {personalisation.recommendedTopic
                      ? `Start with ${personalisation.recommendedTopic.title}. It is currently your first focus area.`
                      : "Open Revision to begin with your strongest next move."}
                  </p>
                </div>

                <div className="rounded-[1.35rem] bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex h-28 items-end gap-2">
                    {knowledgeMapColumns.flatMap((column) => column.items).slice(0, 6).map((item, index) => (
                      <span
                        key={item.topicId}
                        className={cn(
                          "flex-1 rounded-t-full",
                          item.score >= 72 ? "bg-[#93d2a2]" : item.score >= 52 ? "bg-white/75" : "bg-[#f2a65d]",
                          index === 5 && "bg-[#f2a65d]",
                        )}
                        style={{ height: `${Math.max(18, Math.round(item.score))}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-white/78 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2f69b5]">
                <CalendarDays className="h-4 w-4" />
                Exam urgency
              </div>
              <h3 className="mt-2 text-[1.55rem] font-semibold tracking-tight text-slate-900">
                {personalisation.upcomingExam
                  ? `Next up: ${personalisation.upcomingExam.title}`
                  : "Next exam will appear here"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {personalisation.upcomingExam
                  ? `${personalisation.upcomingExam.daysUntil} days remain. Focus first on ${personalisation.upcomingExam.focusLabel.toLowerCase()}.`
                  : "Once a route is selected, the map uses exam timing to order your first focus areas."}
              </p>
              <button type="button" onClick={handleOpenRevision} className="app-button-orange mt-5 w-full">
                Go to Revision
                <ArrowRight className="h-4 w-4" />
              </button>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Strengths"
              tone="blue"
              items={strengthItems}
              emptyLabel="Strengths will appear here once the map has enough evidence."
            />
            <SummaryCard
              title="Weak areas"
              tone="orange"
              items={weakItems}
              emptyLabel="Weak areas will appear here once the map has enough evidence."
            />
            <SummaryCard
              title="Focus areas"
              tone="green"
              items={focusItems}
              emptyLabel="Focus areas will appear here once the map has enough evidence."
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
            {knowledgeMapColumns.map((column) => (
              <KnowledgeMapColumn key={column.paper} paper={column.paper} items={column.items} />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleResetProfile} className="app-button-muted">
              Retake setup
            </button>
            <button type="button" onClick={handleOpenRevision} className="app-button-orange">
              Open personalised Revision
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
