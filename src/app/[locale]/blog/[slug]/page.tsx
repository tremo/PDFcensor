import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

const blogContent: Record<string, { title: string; content: string[] }> = {
  "hipaa-compliant-pdf-redaction": {
    title: "HIPAA Compliant PDF Redaction: A Complete Guide",
    content: [
      "Healthcare organizations handle vast amounts of Protected Health Information (PHI) daily. When sharing documents externally — for legal proceedings, research, or inter-organizational communication — proper redaction is not just best practice, it's a legal requirement under HIPAA.",
      "HIPAA's Privacy Rule requires that covered entities and their business associates protect all individually identifiable health information. This includes names, dates, Social Security numbers, medical record numbers, and 14 other categories of identifiers.",
      "Simple visual redaction — drawing black boxes over sensitive text — is NOT sufficient for HIPAA compliance. The underlying text data must be permanently removed from the document. PDFcensor performs true redaction by removing the actual text data from PDF content streams, not just covering it visually.",
      "Key steps for HIPAA-compliant redaction: (1) Identify all PHI in the document using automated detection, (2) Review and confirm detected items, (3) Apply true redaction that removes text data, (4) Clean document metadata, (5) Verify the redacted document before sharing.",
      "With PDFcensor, all processing happens in your browser — your documents never leave your device. This eliminates the risk of PHI exposure during the redaction process itself, a critical consideration for HIPAA compliance.",
    ],
  },
  "ediscovery-document-redaction": {
    title: "eDiscovery Document Redaction Best Practices",
    content: [
      "In legal proceedings, the eDiscovery process often requires producing large volumes of documents. Many of these documents contain privileged information, trade secrets, or personal data that must be redacted before production.",
      "Redaction in eDiscovery serves multiple purposes: protecting attorney-client privilege, shielding confidential business information, and complying with privacy regulations like GDPR and CCPA that may apply even in litigation contexts.",
      "Common mistakes in eDiscovery redaction include: using highlighter tools instead of true redaction, forgetting to remove metadata, inconsistent redaction across document sets, and failing to redact embedded images or form fields.",
      "PDFcensor supports batch processing — upload multiple PDFs and process them all with consistent redaction rules. This is essential for eDiscovery workflows where hundreds or thousands of documents need uniform treatment.",
      "Best practices: (1) Define redaction categories upfront, (2) Use automated detection to ensure consistency, (3) Always verify with a second reviewer, (4) Maintain a redaction log, (5) Clean metadata from all produced documents.",
    ],
  },
  "gdpr-pdf-compliance": {
    title: "GDPR PDF Compliance: Protecting Personal Data in Documents",
    content: [
      "The General Data Protection Regulation (GDPR) requires organizations to protect personal data of EU residents. PDF documents often contain personal data that must be properly handled — whether for data subject access requests, data sharing agreements, or document retention policies.",
      "Under GDPR, personal data includes any information relating to an identified or identifiable person: names, email addresses, phone numbers, IP addresses, financial information, and more. PDF documents frequently contain multiple categories of personal data.",
      "When responding to data subject access requests (DSARs), organizations may need to provide copies of documents while redacting third-party personal data. This requires careful identification and permanent removal of other individuals' data.",
      "PDFcensor's multi-regulation support includes a GDPR profile that automatically detects common European personal data patterns: names, email addresses, phone numbers, IBAN numbers, and postal addresses. The tool supports all EU languages.",
      "Key GDPR considerations for PDF redaction: (1) Ensure redaction is irreversible — text must be permanently removed, (2) Clean document metadata that may contain personal data, (3) Maintain records of redaction activities, (4) Apply the principle of data minimization.",
    ],
  },
};

type Params = { slug: string; locale: string };

export function generateStaticParams() {
  return Object.keys(blogContent).map((slug) => ({ slug }));
}

export default async function BlogPost({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = blogContent[slug];

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Button asChild variant="outline">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Button asChild variant="ghost" className="mb-8">
        <Link href="/blog">
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </Button>

      <article>
        <h1 className="text-3xl font-bold mb-8">{post.title}</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-xl text-center">
        <h3 className="text-lg font-semibold mb-2">
          Ready to try PDFcensor?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start redacting sensitive data from your PDFs — free, no signup required.
        </p>
        <Button asChild variant="accent">
          <Link href="/redact">
            Start Redacting
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
