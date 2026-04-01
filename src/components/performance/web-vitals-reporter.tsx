"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Dev-only console baseline for LCP / INP / CLS (Google Web Vitals).
 * Run Lighthouse separately for full audits; this gives quick local signal.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    const displayValue =
      metric.name === "CLS"
        ? Math.round(metric.value * 1000) / 1000
        : Math.round(metric.value);
    const rating = "rating" in metric ? String((metric as { rating?: string }).rating ?? "") : "";
    console.info(`[vitals] ${metric.name}`, displayValue, rating);
  });

  return null;
}
