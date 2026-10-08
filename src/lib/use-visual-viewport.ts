"use client";
import { useEffect, useState } from "react";
export function useVisualViewport(active: boolean) {
  const [viewport, setViewport] = useState<{ height: number; top: number }>();
  useEffect(() => {
    if (!active) return;
    const view = window.visualViewport;
    if (!view) return;
    const update = () =>
      setViewport({ height: view.height, top: view.offsetTop });
    update();
    view.addEventListener("resize", update);
    view.addEventListener("scroll", update);
    return () => {
      view.removeEventListener("resize", update);
      view.removeEventListener("scroll", update);
    };
  }, [active]);
  return viewport
    ? {
        "--visible-height": `${viewport.height}px`,
        "--visible-top": `${viewport.top + 12}px`,
        "--visible-bottom": `${viewport.top + viewport.height - 8}px`,
      }
    : {};
}
