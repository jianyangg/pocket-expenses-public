"use client";
import { useEffect, useState } from "react";
import { defaultStatementInputs, type StatementInputs } from "./statements";
export type FinancialSettings = {
  investmentPlan?: import("./investment-plan").InvestmentPlan;
  includeSetup: boolean;
  openingMonth: string;
  inputs: Record<string, StatementInputs>;
};
export function useFinancial(enabled: boolean) {
  const [settings, setSettings] = useState<FinancialSettings>({
    includeSetup: false,
    openingMonth: "",
    inputs: {},
  });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  async function save(next: FinancialSettings) {
    try {
      const response = await fetch("/api/financial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw Error("Could not save settings.");
      setSettings(next);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      return false;
    }
  }
  useEffect(() => {
    if (!enabled) return;
    fetch("/api/financial", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error();
        setSettings(await r.json());
        setReady(true);
      })
      .catch(() => setError("Financial settings unavailable."));
  }, [enabled]);
  return { settings, save, error, ready };
}
export function inputsForMonth(settings: FinancialSettings, month: string) {
  return settings.inputs[month] || { ...defaultStatementInputs };
}
