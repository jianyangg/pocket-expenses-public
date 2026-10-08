import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./pocket-theme.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
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
