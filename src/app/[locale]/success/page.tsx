"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Copy, ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { useState, Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [copied, setCopied] = useState(false);

  // In production, you'd fetch the license key from the session
  const licenseKey = sessionId ? `demo-${sessionId?.slice(0, 8)}` : null;

  const handleCopy = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            Thank you for purchasing PDFcensor Pro. Your license key is below.
          </p>

          {licenseKey && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {licenseKey}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-background rounded cursor-pointer"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}

          {copied && (
            <p className="text-sm text-green-600 text-center">
              Copied to clipboard!
            </p>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Save this key! Enter it in the redaction tool to remove watermarks.
          </p>

          <Button asChild className="w-full" variant="accent">
            <Link href="/redact">
              Start Redacting
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
