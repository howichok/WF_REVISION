"use client";

import type { ComponentType } from "react";
import type { EspScenario } from "@/data/esp/scenarios/types";
import type { SceneDescriptor } from "./types";

export interface SceneProps {
  scenario: EspScenario;
  data?: Record<string, unknown>;
}

export type SceneComponent = ComponentType<SceneProps>;

const registry = new Map<string, SceneComponent>();

export function registerScene(id: string, component: SceneComponent): void {
  registry.set(id, component);
}

export function getScene(id: string): SceneComponent | undefined {
  return registry.get(id);
}

export function hasScene(id: string): boolean {
  return registry.has(id);
}

export function describeScene(id: string, data?: Record<string, unknown>): SceneDescriptor {
  return { id, data };
}
