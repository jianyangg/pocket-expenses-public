"use client";
import { useCallback, useEffect, useState } from "react";
import type { CashSnapshot } from "./cash-forecast";
export function useCash(enabled: boolean) {
  const [cash, setCash] = useState<CashSnapshot | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const r = await fetch("/api/cash", { cache: "no-store" });
      if (!r.ok) throw Error("Could not refresh bank balances.");
      setCash(await r.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Balances unavailable");
    } finally {
      setLoading(false);
    }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) {
      setCash(null);
      return;
    }
    void refresh();
    const timer = setInterval(refresh, 15 * 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, refresh]);
  return { cash, loading, error, refresh };
}
