"use client";

import { useEffect, useState } from "react";

/** True when `dark` class is on html or user prefers dark. */
export function useTheme(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const cls = document.documentElement.classList.contains("dark");
      setDark(cls || prefers);
    };
    read();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", read);
      obs.disconnect();
    };
  }, []);
  return dark;
}
