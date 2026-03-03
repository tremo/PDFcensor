export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Last updated: March 2026</p>

        <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
        <p>
          By using PDFcensor, you agree to these Terms of Service. If you do not
          agree, do not use the service.
        </p>

        <h2 className="text-xl font-semibold mt-8">2. Service Description</h2>
        <p>
          PDFcensor is a client-side PDF redaction tool that detects and removes
          personal identifiable information (PII) from PDF documents. All
          processing occurs in your web browser.
        </p>

        <h2 className="text-xl font-semibold mt-8">3. No Guarantee</h2>
        <p>
          While we strive for accuracy, PDFcensor does not guarantee 100% detection
          of all PII. Users are responsible for reviewing redaction results before
          sharing or publishing documents. Always verify that all sensitive
          information has been properly redacted.
        </p>

        <h2 className="text-xl font-semibold mt-8">4. License</h2>
        <p>
          Free tier: You may use PDFcensor for free with a watermark on output.
          Pro license: A one-time payment grants you a lifetime license to use
          PDFcensor without watermarks.
        </p>

        <h2 className="text-xl font-semibold mt-8">5. Refund Policy</h2>
        <p>
          We offer a 30-day money-back guarantee. Contact us at
          support@pdfcensor.com for refund requests.
        </p>

        <h2 className="text-xl font-semibold mt-8">6. Limitation of Liability</h2>
        <p>
          PDFcensor is provided &ldquo;as is&rdquo; without warranties.
          We are not liable for any damages resulting from the use or
          inability to use the service, including but not limited to
          incomplete redaction of sensitive data.
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Contact</h2>
        <p>For questions about these terms, contact us at legal@pdfcensor.com.</p>
      </div>
    </div>
  );
}
