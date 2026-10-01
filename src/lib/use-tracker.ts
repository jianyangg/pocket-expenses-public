"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { todayInNewYork, type Budget, type Expense } from "@/lib/budget";
import {
  emptySnapshot,
  loadSnapshot,
  mergeImport,
  removeExpense,
  saveBudget,
  saveExpense,
  validateSnapshot,
  type Snapshot,
} from "@/lib/storage";
import { authClient } from "@/lib/auth/client";

export function useTracker() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;
  const authReady = !isPending;
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState("");
  const [month, setMonth] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Expense>();
  const [removed, setRemoved] = useState<Expense>();
  const loadSequence = useRef(0);
  useEffect(() => {
    const date = todayInNewYork();
    setToday(date);
    setMonth(date.slice(0, 7));
    const id = setInterval(() => setToday(todayInNewYork()), 60000);
    return () => clearInterval(id);
  }, []);
  const reload = useCallback(
    async (refresh = false) => {
      const sequence = ++loadSequence.current;
      if (!refresh) setLoaded(false);
      setError("");
      try {
        const next = await loadSnapshot(user?.id);
        if (sequence !== loadSequence.current) return;
        setSnapshot(next);
        setLoaded(true);
      } catch (e) {
        if (sequence === loadSequence.current)
          setError(
            e instanceof Error ? e.message : "Could not load your data.",
          );
      }
    },
    [user?.id],
  );
  useEffect(() => {
    setSnapshot(emptySnapshot());
    setLoaded(false);
    setEditing(undefined);
    setRemoved(undefined);
    if (authReady && user) void reload();
    return () => {
      loadSequence.current++;
    };
  }, [authReady, user?.id, reload]);
  useEffect(() => {
    const refresh = () => {
      if (!locked.current && authReady && user) void reload(true);
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [authReady, user?.id, reload]);
  async function mutate(action: () => Promise<void>) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your changes have not been applied.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function add(e: Expense) {
    return mutate(async () => {
      await saveExpense(e, snapshot, user?.id);
      setSnapshot((s) => ({
        ...s,
        expenses: [...s.expenses.filter((x) => x.id !== e.id), e],
      }));
      setEditing(undefined);
      setNotice("Saved.");
    });
  }
  async function updateBudget(b: Budget) {
    await mutate(async () => {
      await saveBudget(month, b, snapshot, user?.id);
      setSnapshot((s) => ({ ...s, budgets: { ...s.budgets, [month]: b } }));
      setNotice("Monthly plan saved.");
    });
  }
  async function deleteEntry(e: Expense) {
    await mutate(async () => {
      await removeExpense(e.id, snapshot, user?.id);
      setSnapshot((s) => ({
        ...s,
        expenses: s.expenses.filter((x) => x.id !== e.id),
      }));
      setRemoved(e);
      setNotice("Expense removed.");
    });
  }
  async function importFile(file: File) {
    await mutate(async () => {
      const parsed = validateSnapshot(JSON.parse(await file.text()));
      if (
        !window.confirm(
          `Merge ${parsed.expenses.length} expenses and ${Object.keys(parsed.budgets).length} monthly plans? Matching IDs and plans will be updated.`,
        )
      )
        return;
      const merged = await mergeImport(parsed, snapshot, user?.id);
      setSnapshot(merged);
      setNotice("Import complete.");
    });
  }
  return {
    user,
    authReady,
    snapshot,
    loaded,
    today,
    month,
    setMonth,
    busy,
    error,
    setError,
    notice,
    editing,
    setEditing,
    removed,
    setRemoved,
    reload,
    add,
    updateBudget,
    deleteEntry,
    importFile,
  };
}
