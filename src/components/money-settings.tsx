"use client";
import { useEffect, useRef } from "react";
import BankConnection from "./bank-connection";
import type { FinancialSettings } from "@/lib/use-financial";
export default function MoneySettings({
  open,
  onClose,
  onBankChange,
  settings,
  onSave,
  ready,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onBankChange: () => void;
  settings: FinancialSettings;
  onSave: (s: FinancialSettings) => Promise<boolean>;
  ready: boolean;
  error: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus({ preventScroll: true });
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      className="money-settings-sheet"
      aria-labelledby="money-settings-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="settings-sheet-content">
        <div className="section-head">
          <h2 id="money-settings-title">Settings</h2>
          <button className="quiet" onClick={onClose}>
            Done
          </button>
        </div>
        <label className="setup-switch">
          <span>Include setup depreciation</span>
          <input
            type="checkbox"
            role="switch"
            disabled={!ready}
            checked={settings.includeSetup}
            onChange={(e) =>
              void onSave({ ...settings, includeSetup: e.target.checked })
            }
          />
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <BankConnection onChange={onBankChange} visible={open} />
      </div>
    </dialog>
  );
}
