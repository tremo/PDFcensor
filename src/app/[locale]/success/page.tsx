import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Payment Successful — OfflineRedact",
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return <SuccessClient />;
}
