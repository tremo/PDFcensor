import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFcensor",
  description: "Permanently redact PII from PDF documents — 100% client-side",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
