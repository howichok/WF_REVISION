"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EspTask } from "@/data/curriculum";
import { getEspScenario } from "@/data/esp/scenarios";
import type { BriefTag } from "@/lib/esp/rubric";
import type {
  CostLineState,
  DesignBlockState,
  EvalRequirementState,
  ImprovementState,
  PlanBarState,
  TestLogRowState,
} from "@/lib/esp/rubric";

const STORAGE_KEY = "wf-esp-session-v1";

export interface EspSessionState {
  scenarioId: string;
  /** pre_release: segmentId -> chosen tag */
  triageTags: Record<string, BriefTag | undefined>;
  triageNotes: string;
  /** task_1 */
  planBars: PlanBarState[];
  planRationale: string;
  costLines: CostLineState[];
  /** task_2 */
  task2Code: string;
  testLogRows: TestLogRowState[];
  /** task_3 */
  designBlocks: DesignBlockState[];
  pseudocode: string;
  /** task_4a */
  task4aCode: string;
  task4aOutputLog: string[];
  /** task_4b */
  evalSystem: EvalRequirementState[];
  evalUser: EvalRequirementState[];
  improvements: ImprovementState[];
  setScenarioId: (id: string) => void;
  setTriageTag: (segmentId: string, tag: BriefTag | undefined) => void;
  setTriageNotes: (notes: string) => void;
  setPlanBars: (bars: PlanBarState[]) => void;
  setPlanRationale: (r: string) => void;
  setCostLines: (lines: CostLineState[]) => void;
  setTask2Code: (code: string) => void;
  setTestLogRows: (rows: TestLogRowState[]) => void;
  setDesignBlocks: (blocks: DesignBlockState[]) => void;
  setPseudocode: (p: string) => void;
  setTask4aCode: (code: string) => void;
  appendTask4aOutput: (line: string) => void;
  clearTask4aOutput: () => void;
  setEvalSystem: (rows: EvalRequirementState[]) => void;
  setEvalUser: (rows: EvalRequirementState[]) => void;
  setImprovements: (rows: ImprovementState[]) => void;
  hydrateFromScenario: (scenarioId: string) => void;
  resetScenario: (scenarioId: string) => void;
}

function defaultTestRows(): TestLogRowState[] {
  return [
    { purpose: "", input: "", expected: "", actual: "" },
    { purpose: "", input: "", expected: "", actual: "" },
    { purpose: "", input: "", expected: "", actual: "" },
  ];
}

function defaultEvalRows(
  system: string[],
  user: string[]
): { sys: EvalRequirementState[]; usr: EvalRequirementState[] } {
  return {
    sys: system.map((_, i) => ({ id: i, status: "partial" as const, evidence: "" })),
    usr: user.map((_, i) => ({ id: i, status: "partial" as const, evidence: "" })),
  };
}

function defaultImprovements(): ImprovementState[] {
  return [
    { what: "", why: "", impact: "" },
    { what: "", why: "", impact: "" },
  ];
}

export const useEspSessionStore = create<EspSessionState>()(
  persist(
    (set, get) => ({
      scenarioId: "car-sales",
      triageTags: {},
      triageNotes: "",
      planBars: [],
      planRationale: "",
      costLines: [],
      task2Code: "",
      testLogRows: defaultTestRows(),
      designBlocks: [],
      pseudocode: "",
      task4aCode: "",
      task4aOutputLog: [],
      evalSystem: [],
      evalUser: [],
      improvements: defaultImprovements(),

      setScenarioId: (id) => set({ scenarioId: id }),
      setTriageTag: (segmentId, tag) =>
        set((s) => ({ triageTags: { ...s.triageTags, [segmentId]: tag } })),
      setTriageNotes: (triageNotes) => set({ triageNotes }),
      setPlanBars: (planBars) => set({ planBars }),
      setPlanRationale: (planRationale) => set({ planRationale }),
      setCostLines: (costLines) => set({ costLines }),
      setTask2Code: (task2Code) => set({ task2Code }),
      setTestLogRows: (testLogRows) => set({ testLogRows }),
      setDesignBlocks: (designBlocks) => set({ designBlocks }),
      setPseudocode: (pseudocode) => set({ pseudocode }),
      setTask4aCode: (task4aCode) => set({ task4aCode }),
      appendTask4aOutput: (line) =>
        set((s) => ({ task4aOutputLog: [...s.task4aOutputLog, line].slice(-80) })),
      clearTask4aOutput: () => set({ task4aOutputLog: [] }),
      setEvalSystem: (evalSystem) => set({ evalSystem }),
      setEvalUser: (evalUser) => set({ evalUser }),
      setImprovements: (improvements) => set({ improvements }),

      hydrateFromScenario: (scenarioId) => {
        const sc = getEspScenario(scenarioId);
        if (!sc) return;
        const cur = get();
        // Re-hydrate if switching scenario, or same scenario but never loaded starter code
        if (cur.scenarioId === scenarioId && cur.task2Code.length > 20) return;

        const { sys, usr } = defaultEvalRows(sc.task4b.systemRequirements, sc.task4b.userRequirements);
        set({
          scenarioId,
          triageTags: {},
          triageNotes: "",
          planBars: sc.suggestedStages.map((stage, i) => ({
            stage,
            startWeek: Math.min(i + 1, sc.planWeeks - 1),
            endWeek: Math.min(i + 2, sc.planWeeks),
            roleId: sc.roles[i % sc.roles.length]!.id,
          })),
          planRationale: "",
          costLines: [{ label: "Build sprint", days: 10, roleId: sc.roles[1]!.id }],
          task2Code: sc.task2.buggyCode,
          testLogRows: defaultTestRows(),
          designBlocks: [
            { id: "b1", kind: "Input", label: "Read CSV rows" },
            { id: "b2", kind: "Validate", label: "Check columns" },
            { id: "b3", kind: "Process", label: "Aggregate" },
            { id: "b4", kind: "Output", label: "Print summary" },
          ],
          pseudocode: `# ${sc.title}\n# ${sc.task3.designPrompt}\n`,
          task4aCode: sc.task4a.starterCode,
          task4aOutputLog: [],
          evalSystem: sys,
          evalUser: usr,
          improvements: defaultImprovements(),
        });
      },

      resetScenario: (scenarioId) => {
        const sc = getEspScenario(scenarioId);
        if (!sc) return;
        const { sys, usr } = defaultEvalRows(sc.task4b.systemRequirements, sc.task4b.userRequirements);
        set({
          scenarioId,
          triageTags: {},
          triageNotes: "",
          planBars: [],
          planRationale: "",
          costLines: [],
          task2Code: sc.task2.buggyCode,
          testLogRows: defaultTestRows(),
          designBlocks: [],
          pseudocode: "",
          task4aCode: sc.task4a.starterCode,
          task4aOutputLog: [],
          evalSystem: sys,
          evalUser: usr,
          improvements: defaultImprovements(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        scenarioId: s.scenarioId,
        triageTags: s.triageTags,
        triageNotes: s.triageNotes,
        planBars: s.planBars,
        planRationale: s.planRationale,
        costLines: s.costLines,
        task2Code: s.task2Code,
        testLogRows: s.testLogRows,
        designBlocks: s.designBlocks,
        pseudocode: s.pseudocode,
        task4aCode: s.task4aCode,
        task4aOutputLog: s.task4aOutputLog,
        evalSystem: s.evalSystem,
        evalUser: s.evalUser,
        improvements: s.improvements,
      }),
    }
  )
);

export function getEspStoreSnapshotForRubric(task: EspTask, scenarioId: string): unknown {
  const s = useEspSessionStore.getState();
  if (s.scenarioId !== scenarioId) return {};
  switch (task) {
    case "pre_release":
      return s.triageTags;
    case "task_1":
      return { bars: s.planBars, rationale: s.planRationale, costLines: s.costLines };
    case "task_2":
      return { code: s.task2Code, rows: s.testLogRows };
    case "task_3":
      return { blocks: s.designBlocks, pseudocode: s.pseudocode };
    case "task_4a":
      return { code: s.task4aCode, lastOutput: s.task4aOutputLog.join("\n") };
    case "task_4b":
      return { system: s.evalSystem, user: s.evalUser, improvements: s.improvements };
    default:
      return {};
  }
}
