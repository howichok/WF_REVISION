"use client";

import { useReportWebVitals } from "next/web-vitals";

function shouldReportWebVitals() {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return process.env.NEXT_PUBLIC_WEB_VITALS === "1";
}

/**
 * LCP / INP / CLS (Web Vitals): always in development; in production set
 * `NEXT_PUBLIC_WEB_VITALS=1` to log the same metrics (e.g. mobile smoke tests).
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!shouldReportWebVitals()) {
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
