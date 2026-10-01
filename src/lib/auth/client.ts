"use client";
import { useEffect, useState } from "react";
const event = "pocket-session-changed";
async function request(method: string, password?: string) {
  const response = await fetch("/api/session", {
    method,
    headers: { "Content-Type": "application/json" },
    body: password === undefined ? undefined : JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not sign in.");
  window.dispatchEvent(new Event(event));
  return data;
}
export const authClient = {
  signIn: (password: string) => request("POST", password),
  signOut: async () => {
    try {
      await request("DELETE");
      return { error: null };
    } catch (e) {
      return {
        error: {
          message: e instanceof Error ? e.message : "Could not sign out.",
        },
      };
    }
  },
  useSession: () => {
    const [data, setData] = useState<{ user: { id: string } } | null>(null);
    const [isPending, setPending] = useState(true);
    useEffect(() => {
      let active = true;
      const refresh = async () => {
        try {
          const response = await fetch("/api/session");
          if (!response.ok) throw new Error();
          const value = await response.json();
          if (active) setData(value);
        } catch {
          if (active) setData(null);
        } finally {
          if (active) setPending(false);
        }
      };
      void refresh();
      window.addEventListener(event, refresh);
      return () => {
        active = false;
        window.removeEventListener(event, refresh);
      };
    }, []);
    return { data, isPending };
  },
};
