import { NextResponse } from "next/server";
import { generatePlanXlsx } from "@/lib/esp/excel-template";
import {
  generatePreReleaseDocx,
  generateTask2Docx,
  generateTask3Docx,
  generateTask4aDocx,
  generateTask4bDocx,
} from "@/lib/esp/docx-templates";
import { getEspScenario } from "@/data/esp/scenarios";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get("scenario") ?? "car-sales";
  const task = searchParams.get("task") ?? "task-1";

  const scenario = getEspScenario(scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  try {
    switch (task) {
      case "task-1":
      case "task_1": {
        const buffer = await generatePlanXlsx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="Task1_ProjectPlan_${scenarioId}.xlsx"`,
          },
        });
      }
      case "pre-release":
      case "pre_release": {
        const buffer = await generatePreReleaseDocx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="ESP_PreRelease_${scenarioId}.docx"`,
          },
        });
      }
      case "task-2":
      case "task_2": {
        const buffer = await generateTask2Docx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="ESP_Task2_${scenarioId}.docx"`,
          },
        });
      }
      case "task-3":
      case "task_3": {
        const buffer = await generateTask3Docx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="ESP_Task3_Design_${scenarioId}.docx"`,
          },
        });
      }
      case "task-4a":
      case "task_4a": {
        const buffer = await generateTask4aDocx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="ESP_Task4a_Evidence_${scenarioId}.docx"`,
          },
        });
      }
      case "task-4b":
      case "task_4b": {
        const buffer = await generateTask4bDocx(scenario);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="ESP_Task4b_Evaluation_${scenarioId}.docx"`,
          },
        });
      }
      default:
        return NextResponse.json({ error: "Unknown task" }, { status: 400 });
    }
  } catch (e) {
    console.error("template generation error", e);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}
