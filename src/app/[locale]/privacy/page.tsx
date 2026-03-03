export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Introduction</h2>
        <p>
          OfflineRedact (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy.
          This policy explains how we handle information when you use our PDF redaction tool.
        </p>

        <h2 className="text-xl font-semibold mt-8">2. No File Uploads</h2>
        <p>
          <strong>Your PDF files never leave your device.</strong> All PDF processing,
          including text extraction, PII detection, and redaction, happens entirely
          in your web browser. We do not upload, store, process, or have access to
          your documents on any server.
        </p>

        <h2 className="text-xl font-semibold mt-8">3. Information We Collect</h2>
        <p>We collect minimal information necessary for our service:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Email address (only if you purchase a Pro license, via Stripe)</li>
          <li>Payment information (processed by Stripe; we never see your card details)</li>
          <li>Basic analytics (page views, feature usage — no personal data)</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">4. Cookies</h2>
        <p>
          We use essential cookies only: locale preference and license key storage
          (in localStorage). We do not use tracking cookies.
        </p>

        <h2 className="text-xl font-semibold mt-8">5. Third-Party Services</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Stripe</strong> — Payment processing. See Stripe&apos;s privacy policy.</li>
          <li><strong>Vercel</strong> — Hosting. See Vercel&apos;s privacy policy.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">6. Data Retention</h2>
        <p>
          License keys are stored for the duration of your license.
          We do not store any PDF content or personal data extracted from documents.
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Contact</h2>
        <p>For privacy-related inquiries, contact us at privacy@offlineredact.com.</p>
      </div>
    </div>
  );
}
