import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Pocket — your spending, at a glance",
  description:
    "A personal expense tracker with quick hashtag entry and daily spending guidance.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
