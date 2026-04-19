/**
 * Central registration point. Importing this file has the side effect of
 * populating the scene registry. Scene files import this module indirectly
 * via <SceneRenderer>.
 */
import { registerScene } from "../registry";

import { BriefTriageScene } from "./brief-triage-scene";
import { DeliverablesPipelineScene } from "./deliverables-pipeline-scene";
import { PracticeUploadScene } from "./practice-upload-scene";

import { PlanLayersScene } from "./task1/plan-layers-scene";
import { BriefHighlightScene } from "./task1/brief-highlight-scene";
import { SdlcCompareScene } from "./task1/sdlc-compare-scene";
import { GanttBuildScene } from "./task1/gantt-build-scene";
import { DepArrowsScene } from "./task1/dep-arrows-scene";
import { RolesMapScene } from "./task1/roles-map-scene";
import { TestingLaneScene } from "./task1/testing-lane-scene";
import { RiskTableScene } from "./task1/risk-table-scene";
import { RationaleCompareScene } from "./task1/rationale-compare-scene";
import { MistakeCardsScene } from "./task1/mistake-cards-scene";

import { DefectPipelineScene } from "./task2/defect-pipeline-scene";
import { TestTableScene } from "./task2/test-table-scene";
import { FixCardsScene } from "./task2/fix-cards-scene";

import { IpoFlowScene } from "./task3/ipo-flow-scene";
import { DesignArtefactsScene } from "./task3/design-artefacts-scene";
import { DesignCompareScene } from "./task3/design-compare-scene";

import { BuildQuadrantScene } from "./task4a/build-quadrant-scene";
import { RunPipelineScene } from "./task4a/run-pipeline-scene";
import { UnitTestChecklistScene } from "./task4a/unit-test-checklist-scene";
import { CoverageTableScene } from "./task4a/coverage-table-scene";

import { EvalMatrixScene } from "./task4b/eval-matrix-scene";
import { EvalCompareScene } from "./task4b/eval-compare-scene";

registerScene("brief-triage", BriefTriageScene);
registerScene("deliverables-pipeline", DeliverablesPipelineScene);
registerScene("practice-upload", PracticeUploadScene);

registerScene("task1-plan-layers", PlanLayersScene);
registerScene("task1-brief-highlight", BriefHighlightScene);
registerScene("task1-sdlc-compare", SdlcCompareScene);
registerScene("task1-gantt-build", GanttBuildScene);
registerScene("task1-dep-arrows", DepArrowsScene);
registerScene("task1-roles-map", RolesMapScene);
registerScene("task1-testing-lane", TestingLaneScene);
registerScene("task1-risk-table", RiskTableScene);
registerScene("task1-rationale-compare", RationaleCompareScene);
registerScene("task1-mistake-cards", MistakeCardsScene);

registerScene("task2-defect-pipeline", DefectPipelineScene);
registerScene("task2-test-table", TestTableScene);
registerScene("task2-fix-cards", FixCardsScene);

registerScene("task3-ipo-flow", IpoFlowScene);
registerScene("task3-design-artefacts", DesignArtefactsScene);
registerScene("task3-design-compare", DesignCompareScene);

registerScene("task4a-build-quadrant", BuildQuadrantScene);
registerScene("task4a-run-pipeline", RunPipelineScene);
registerScene("task4a-unit-test-checklist", UnitTestChecklistScene);
registerScene("task4a-coverage-table", CoverageTableScene);

registerScene("task4b-eval-matrix", EvalMatrixScene);
registerScene("task4b-eval-compare", EvalCompareScene);
