"use client";
import { useRef } from "react";
import { downloadSnapshot, type Snapshot } from "@/lib/storage";
import { authClient } from "@/lib/auth/client";
export default function TrackerTools({
  snapshot,
  busy,
  importFile,
  setError,
}: {
  snapshot: Snapshot;
  busy: boolean;
  importFile: (f: File) => Promise<void>;
  setError: (e: string) => void;
}) {
  const importInput = useRef<HTMLInputElement>(null);
  return (
    <footer>
      <div>
        <button
          className="quiet"
          disabled={busy}
          onClick={() => {
            const raw = localStorage.getItem("pocket-expenses-v1");
            if (!raw) {
              setError("No previous browser entries found.");
              return;
            }
            void importFile(
              new File([raw], "browser-entries.json", {
                type: "application/json",
              }),
            );
          }}
        >
          Import browser entries
        </button>
        <button
          className="quiet"
          disabled={busy}
          onClick={async () => {
            const { error } = await authClient.signOut();
            if (error) setError(error.message ?? "Could not sign out.");
          }}
        >
          Sign out
        </button>

        <button className="quiet" onClick={() => downloadSnapshot(snapshot)}>
          Export for analysis
        </button>
        <button
          className="quiet"
          disabled={busy}
          onClick={() => importInput.current?.click()}
        >
          Import backup
        </button>
        <input
          ref={importInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import Pocket export"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </footer>
  );
}
