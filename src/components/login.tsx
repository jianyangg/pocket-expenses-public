"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
export default function Login() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authClient.signIn(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <div className="wordmark">
        pocket<span> / personal finances</span>
      </div>
      <h1>
        Your money.
        <br />A little clearer.
      </h1>
      <p>Sign in to your private spending tracker.</p>
      <form onSubmit={signIn} className="panel">
        <label>
          Password
          <input
            type="password"
            required
            minLength={1}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button disabled={busy}>
          {busy ? "Please wait…" : "Unlock Pocket"}
        </button>
        <p>
          You’ll stay signed in on this device. Expenses save automatically.
        </p>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
      </form>
    </main>
  );
}
