"use client";
import { useEffect, useRef, useState } from "react";
type Handler = { open: () => void; destroy: () => void };
type PlaidWindow = Window & {
  Plaid?: {
    create: (options: {
      token: string;
      receivedRedirectUri?: string;
      onSuccess: (token: string) => void;
      onExit: (error: { display_message?: string } | null) => void;
    }) => Handler;
  };
};
export async function bankAction(body: Record<string, unknown>) {
  const response = await fetch("/api/bank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Bank request failed.");
  return data;
}
export function useBankLink(onConnected: () => void) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const handler = useRef<Handler | null>(null);
  const callback = useRef(onConnected);
  callback.current = onConnected;
  useEffect(() => () => handler.current?.destroy(), []);
  async function open(resume = false) {
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      let token: string;
      let update = false;
      if (resume) {
        token = sessionStorage.getItem("pocket-bank-link") || "";
        update = sessionStorage.getItem("pocket-bank-update") === "true";
        if (!token)
          throw new Error(
            "Return to Pocket and start connecting your bank again.",
          );
      } else {
        const data = await bankAction({ action: "link" });
        token = data.token;
        update = data.update;
        sessionStorage.setItem("pocket-bank-link", token);
        sessionStorage.setItem("pocket-bank-update", String(update));
      }
      handler.current?.destroy();
      handler.current = (window as PlaidWindow).Plaid!.create({
        token,
        ...(resume ? { receivedRedirectUri: window.location.href } : {}),
        onSuccess: async (publicToken) => {
          try {
            if (!update) await bankAction({ action: "exchange", publicToken });
            else await bankAction({ action: "sync" });
            sessionStorage.removeItem("pocket-bank-link");
            sessionStorage.removeItem("pocket-bank-update");
            callback.current();
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Could not connect bank.",
            );
          } finally {
            setBusy(false);
          }
        },
        onExit: (exitError) => {
          setBusy(false);
          if (exitError)
            setError(
              exitError.display_message || "Bank connection was not completed.",
            );
        },
      });
      handler.current.open();
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof Error ? e.message : "Could not start bank connection.",
      );
    }
  }
  return { ready, setReady, error, busy, open };
}
