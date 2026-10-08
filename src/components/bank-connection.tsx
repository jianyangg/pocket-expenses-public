"use client";
import { useCallback, useEffect, useState } from "react";
import BankSyncSummary from "./bank-sync-summary";
import Script from "next/script";
import { bankAction, useBankLink } from "@/lib/bank/use-bank-link";
import { money } from "@/lib/budget";
import type { BankStatus } from "@/lib/bank/types";
export default function BankConnection({
  onChange,
  visible = true,
}: {
  onChange: () => void;
  visible?: boolean;
}) {
  const [state, setState] = useState<BankStatus>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingLink, setPendingLink] = useState(false);
  useEffect(() => {
    setPendingLink(Boolean(sessionStorage.getItem("pocket-bank-link")));
  }, []);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/bank", { cache: "no-store" });
      if (!response.ok) throw new Error("Bank connection is unavailable.");
      setState(await response.json());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load bank connection.",
      );
    }
  }, []);
  const link = useBankLink(() => {
    void load();
    onChange();
  });
  useEffect(() => {
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);
  useEffect(() => {
    if (!state?.connected) return;
    let active = true;
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await bankAction({ action: "sync" });
        if (active) {
          setState(next);
          onChange();
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Could not sync bank.");
      }
    };
    void sync();
    window.addEventListener("focus", sync);
    const timer = setInterval(sync, 300000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, [state?.connected, onChange]);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await bankAction(body);
      await load();
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bank request failed.");
    } finally {
      setBusy(false);
    }
  }
  if (!visible || (!state && !error)) return null;
  return (
    <section className="panel bank-connection">
      {state?.configured ? (
        <Script
          src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
          onReady={() => link.setReady(true)}
          onError={() => setError("Could not load Plaid. Please retry.")}
        />
      ) : null}
      <div className="section-head">
        <h2>Bank sync</h2>
        {state?.connected ? <span>Connected</span> : null}
      </div>
      {state?.configured ? (
        <>
          {state.connected ? (
            <>
              <BankSyncSummary state={state} />
              <button
                disabled={busy}
                onClick={() => void action({ action: "sync" })}
              >
                {busy ? "Checking…" : "Check now"}
              </button>{" "}
              <button
                className="quiet"
                disabled={!link.ready || link.busy}
                onClick={() => void link.open()}
              >
                Reconnect
              </button>{" "}
              <button
                className="quiet"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Disconnect bank sync? Imported expenses will stay.",
                    )
                  )
                    void action({ action: "disconnect" });
                }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              disabled={!link.ready || link.busy}
              onClick={() => void link.open()}
            >
              {pendingLink ? "Resume connection" : "Connect bank"}
            </button>
          )}
          {state.reviews.length ? (
            <details open>
              <summary>
                {state.reviews.length} possible duplicates to review
              </summary>
              <p className="hint">
                These are not included in your balance yet. Skip if you already
                entered the purchase.
              </p>
              {state.reviews.map((t) => (
                <div className="bank-review" key={t.id}>
                  <span>
                    {t.description}
                    <small>
                      {t.date} · {money(t.amount)}
                    </small>
                  </span>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void action({
                        action: "review",
                        id: t.id,
                        choice: "include",
                      })
                    }
                  >
                    Add
                  </button>
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={() =>
                      void action({
                        action: "review",
                        id: t.id,
                        choice: "ignore",
                      })
                    }
                  >
                    Skip
                  </button>
                </div>
              ))}
            </details>
          ) : null}
        </>
      ) : (
        <p className="hint">
          Bank sync needs Plaid credentials in the server settings.
        </p>
      )}
      {!state?.connected && pendingLink ? (
        <button
          className="quiet"
          disabled={!link.ready || link.busy}
          onClick={() => {
            sessionStorage.removeItem("pocket-bank-link");
            sessionStorage.removeItem("pocket-bank-update");
            setPendingLink(false);
            void link.open();
          }}
        >
          Start over
        </button>
      ) : null}
      {error || link.error ? (
        <p className="error" role="alert">
          {error || link.error}
        </p>
      ) : null}
    </section>
  );
}
