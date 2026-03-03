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
    name: "OfflineRedact",
    description:
      "Permanently redact personal data from PDF documents. 100% client-side processing.",
    url: `https://offlineredact.com/${locale}`,
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
    screenshot: "https://offlineredact.com/og-image.png",
    softwareHelp: {
      "@type": "CreativeWork",
      url: `https://offlineredact.com/${locale}/blog`,
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OfflineRedact",
    url: "https://offlineredact.com",
    logo: "https://offlineredact.com/favicon.ico",
    sameAs: [],
  };
}
