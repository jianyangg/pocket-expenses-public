"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { useBankLink } from "@/lib/bank/use-bank-link";
export default function BankReturn() {
  const link = useBankLink(() => {
    window.location.replace("/");
  });
  const started = useRef(false);
  useEffect(() => {
    if (link.ready && !started.current) {
      started.current = true;
      void link.open(true);
    }
  }, [link.ready, link.open]);
  return (
    <main className="shell">
      <section className="panel">
        <h1>Connecting your bank</h1>
        <p>
          {link.error ||
            "Complete the Chase authorization to return to Pocket."}
        </p>
        <a href="/">Return to Pocket</a>
      </section>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        onReady={() => link.setReady(true)}
      />
    </main>
  );
}
