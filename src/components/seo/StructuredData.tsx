interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function getWebApplicationSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PDFcensor",
    description:
      "Permanently redact personal data from PDF documents. 100% client-side processing.",
    url: `https://pdfcensor.com/${locale}`,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Automatic PII detection",
      "True text redaction",
      "Client-side processing",
      "HIPAA compliant",
      "GDPR compliant",
      "Metadata cleaning",
      "Batch processing",
    ],
    screenshot: "https://pdfcensor.com/og-image.png",
    softwareHelp: {
      "@type": "CreativeWork",
      url: `https://pdfcensor.com/${locale}/blog`,
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PDFcensor",
    url: "https://pdfcensor.com",
    logo: "https://pdfcensor.com/favicon.ico",
    sameAs: [],
  };
}
