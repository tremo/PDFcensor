import { Link } from "@/lib/i18n/navigation";

const blogPosts = [
  {
    slug: "hipaa-compliant-pdf-redaction",
    title: "HIPAA Compliant PDF Redaction: A Complete Guide",
    excerpt:
      "Learn how to properly redact protected health information (PHI) from PDF documents to maintain HIPAA compliance.",
    date: "2026-02-15",
  },
  {
    slug: "ediscovery-document-redaction",
    title: "eDiscovery Document Redaction Best Practices",
    excerpt:
      "Essential guide for legal professionals on redacting sensitive information during the eDiscovery process.",
    date: "2026-02-10",
  },
  {
    slug: "gdpr-pdf-compliance",
    title: "GDPR PDF Compliance: Protecting Personal Data in Documents",
    excerpt:
      "How to ensure your PDF documents comply with GDPR data protection requirements through proper redaction.",
    date: "2026-02-05",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="space-y-8">
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="group border border-border rounded-xl p-6 hover:shadow-md transition-all"
          >
            <Link href={`/blog/${post.slug}`}>
              <p className="text-sm text-muted-foreground mb-2">{post.date}</p>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                {post.title}
              </h2>
              <p className="text-muted-foreground">{post.excerpt}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
