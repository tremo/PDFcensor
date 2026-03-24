import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

const blogContent: Record<string, { title: string; content: string[] }> = {
  "kvkk-pdf-redaction-guide": {
    title: "KVKK Uyumlu PDF Sansürleme: Kapsamlı Rehber",
    content: [
      "Türkiye'de 2016 yılında yürürlüğe giren Kişisel Verilerin Korunması Kanunu (KVKK), kuruluşların kişisel verileri işlerken ve paylaşırken uyması gereken katı kurallar getirmektedir. PDF belgeleri, TC kimlik numaraları, telefon numaraları, e-posta adresleri ve IBAN gibi hassas verileri sıklıkla içerir.",
      "KVKK'nın 7. maddesi, kişisel verilerin işlenmesini gerektiren sebeplerin ortadan kalkması halinde verilerin silinmesini, yok edilmesini veya anonim hale getirilmesini zorunlu kılar. PDF belgelerinde bu yükümlülüğü yerine getirmenin en etkili yolu, kalıcı sansürleme (redaksiyon) uygulamaktır.",
      "Görsel maskeleme — hassas metnin üzerine siyah kutu çizmek — KVKK uyumluluğu için yeterli değildir. Alttaki metin verisi belgeden kalıcı olarak kaldırılmalıdır. OfflineRedact, PDF içerik akışlarından gerçek metin verisini kaldırarak gerçek sansürleme gerçekleştirir.",
      "OfflineRedact'ın KVKK profili, Türkiye'ye özgü kişisel veri kalıplarını otomatik olarak tespit eder: TC Kimlik numaraları (sağlama doğrulaması ile), Türk telefon numaraları (+90 formatı), e-posta adresleri, IBAN numaraları, isimler ve adresler. Tüm işlemler tarayıcınızda gerçekleşir — belgeleriniz cihazınızdan asla ayrılmaz.",
      "KVKK uyumlu PDF sansürleme adımları: (1) Belgedeki tüm kişisel verileri otomatik algılama ile tespit edin, (2) Tespit edilen öğeleri gözden geçirin ve onaylayın, (3) Metin verisini kaldıran gerçek sansürleme uygulayın, (4) Belge meta verilerini temizleyin (yazar, oluşturma tarihi vb.), (5) Paylaşmadan önce sansürlenmiş belgeyi doğrulayın.",
    ],
  },
  "dsgvo-pdf-schwaerzung": {
    title: "DSGVO-konforme PDF-Schwärzung: Vollständiger Leitfaden",
    content: [
      "Die Datenschutz-Grundverordnung (DSGVO) stellt strenge Anforderungen an den Umgang mit personenbezogenen Daten in der EU. PDF-Dokumente enthalten häufig sensible Informationen wie Namen, E-Mail-Adressen, Telefonnummern, IBAN-Nummern und Adressen, die vor der Weitergabe geschützt werden müssen.",
      "Artikel 17 der DSGVO — das Recht auf Löschung — verlangt, dass Organisationen personenbezogene Daten auf Anfrage dauerhaft entfernen können. Bei PDF-Dokumenten bedeutet dies eine unwiderrufliche Schwärzung, nicht nur eine visuelle Abdeckung. Die zugrundeliegenden Textdaten müssen vollständig aus dem Dokument entfernt werden.",
      "Häufige Fehler bei der PDF-Schwärzung: (1) Verwendung von Textmarkern oder schwarzen Balken, die einfach kopiert und eingefügt werden können, (2) Vergessen der Metadaten-Bereinigung (Autor, Software, Erstellungsdatum), (3) Inkonsistente Schwärzung über mehrere Dokumente hinweg, (4) Hochladen sensibler Dokumente auf Cloud-basierte Dienste.",
      "OfflineRedact löst diese Probleme durch echte Schwärzung direkt in Ihrem Browser. Kein Upload auf Server erforderlich — Ihre Dokumente verlassen niemals Ihr Gerät. Das DSGVO-Profil erkennt automatisch europäische personenbezogene Daten: Namen, E-Mail-Adressen, Telefonnummern, IBAN-Nummern und Postadressen in allen 24 EU-Sprachen.",
      "Best Practices für DSGVO-konforme PDF-Schwärzung: (1) Verwenden Sie automatische Erkennung für konsistente Ergebnisse, (2) Stellen Sie sicher, dass die Schwärzung irreversibel ist, (3) Bereinigen Sie Dokument-Metadaten, (4) Führen Sie Aufzeichnungen über Schwärzungsaktivitäten gemäß der Rechenschaftspflicht nach Art. 5 Abs. 2 DSGVO, (5) Verarbeiten Sie Dokumente lokal, um das Risiko von Datenschutzverletzungen zu minimieren.",
    ],
  },
  "client-side-vs-server-side-redaction": {
    title: "Client-Side vs Server-Side PDF Redaction: Security Comparison",
    content: [
      "When it comes to redacting sensitive information from PDFs, one of the most critical decisions is where the processing happens. Server-side redaction tools require you to upload your documents to a remote server, while client-side tools like OfflineRedact process everything locally in your browser.",
      "Server-side redaction introduces several security risks: (1) Documents are transmitted over the internet, creating interception opportunities, (2) Files are stored on third-party servers, even temporarily, (3) Server breaches can expose all uploaded documents, (4) You must trust the provider's data handling and retention policies, (5) Compliance auditors may flag server-side processing as a risk.",
      "Client-side redaction eliminates these risks entirely. Your documents never leave your device — all PII detection, redaction, and metadata cleaning happens in your browser's JavaScript engine. There is zero network transmission of document content, zero server storage, and zero third-party access to your files.",
      "For regulated industries, this distinction is crucial. HIPAA requires that PHI be protected during processing. GDPR mandates data minimization — why send data to a server when you don't need to? KVKK and CCPA have similar requirements. Client-side processing is inherently more compliant because it removes the server as a potential point of failure.",
      "OfflineRedact uses WebAssembly and browser APIs to achieve the same quality of redaction as server-side tools — automatic PII detection with 13 pattern types, true text removal from PDF content streams, metadata cleaning, and batch processing — all without a single byte of your document data ever leaving your browser.",
    ],
  },
  "pdf-redaction-healthcare-checklist": {
    title: "PDF Redaction for Healthcare: HIPAA Compliance Checklist",
    content: [
      "Healthcare organizations face unique challenges when sharing documents externally. Patient records, insurance forms, lab results, and clinical notes all contain Protected Health Information (PHI) that must be redacted before disclosure. This checklist ensures your PDF redaction workflow meets HIPAA requirements.",
      "PHI Categories to Redact: HIPAA defines 18 PHI identifiers that must be protected: (1) Names, (2) Geographic data smaller than a state, (3) Dates related to an individual, (4) Phone numbers, (5) Fax numbers, (6) Email addresses, (7) Social Security numbers, (8) Medical record numbers, (9) Health plan beneficiary numbers, (10) Account numbers, (11) Certificate/license numbers, (12) Vehicle identifiers, (13) Device identifiers, (14) Web URLs, (15) IP addresses, (16) Biometric identifiers, (17) Full-face photos, (18) Any other unique identifying number.",
      "Pre-Redaction Checklist: Before redacting, verify that (1) you have identified all PHI in the document, (2) you are using a tool that performs true redaction (text removal, not visual overlay), (3) the tool cleans document metadata, (4) the tool processes documents locally or in a HIPAA-compliant environment, (5) you have a process for quality review after redaction.",
      "Post-Redaction Verification: After redacting, confirm that (1) redacted text cannot be recovered by selecting, copying, or using text extraction tools, (2) document metadata has been cleaned (author name, creation software, timestamps), (3) the redaction log has been saved for compliance records, (4) the original unredacted document is stored securely or destroyed per retention policy.",
      "OfflineRedact streamlines this entire workflow with its HIPAA regulation profile. It automatically detects SSNs, names, phone numbers, email addresses, and other PHI identifiers. All processing happens in your browser — no PHI is ever transmitted to external servers, making it inherently HIPAA-compliant for the redaction process itself.",
    ],
  },
  "ccpa-pdf-redaction": {
    title: "CCPA Compliance: How to Redact Personal Information from PDFs",
    content: [
      "The California Consumer Privacy Act (CCPA) and its amendment, the CPRA, give California consumers the right to know what personal information businesses collect, the right to delete it, and the right to opt out of its sale. When responding to consumer requests or sharing documents, businesses must properly redact personal information from PDFs.",
      "CCPA defines personal information broadly: names, Social Security numbers, email addresses, purchasing history, browsing history, geolocation data, biometric information, and any information that could be linked to a consumer or household. PDF documents in HR, legal, finance, and customer service departments frequently contain multiple categories of this data.",
      "Key CCPA redaction scenarios: (1) Responding to consumer access requests — you may need to share records while redacting third-party information, (2) Data sharing with service providers — contracts and reports may need consumer PII removed, (3) Internal audits — compliance teams reviewing documents may need to work with redacted copies, (4) Litigation holds — legal proceedings may require production of documents with certain PII redacted.",
      "Common CCPA redaction mistakes to avoid: (1) Using visual overlays instead of true redaction — covered text can be extracted, (2) Forgetting to redact metadata containing personal information, (3) Inconsistent redaction across document sets, (4) Uploading documents containing California consumer data to non-compliant cloud services for processing.",
      "OfflineRedact's CCPA regulation profile automatically detects SSNs, ITINs, email addresses, US phone numbers, credit card numbers, and names. The client-side architecture means California consumer data never leaves your device during the redaction process, eliminating the risk of unauthorized disclosure. Batch processing ensures consistent redaction across large document sets.",
    ],
  },
  "hipaa-compliant-pdf-redaction": {
    title: "HIPAA Compliant PDF Redaction: A Complete Guide",
    content: [
      "Healthcare organizations handle vast amounts of Protected Health Information (PHI) daily. When sharing documents externally — for legal proceedings, research, or inter-organizational communication — proper redaction is not just best practice, it's a legal requirement under HIPAA.",
      "HIPAA's Privacy Rule requires that covered entities and their business associates protect all individually identifiable health information. This includes names, dates, Social Security numbers, medical record numbers, and 14 other categories of identifiers.",
      "Simple visual redaction — drawing black boxes over sensitive text — is NOT sufficient for HIPAA compliance. The underlying text data must be permanently removed from the document. OfflineRedact performs true redaction by removing the actual text data from PDF content streams, not just covering it visually.",
      "Key steps for HIPAA-compliant redaction: (1) Identify all PHI in the document using automated detection, (2) Review and confirm detected items, (3) Apply true redaction that removes text data, (4) Clean document metadata, (5) Verify the redacted document before sharing.",
      "With OfflineRedact, all processing happens in your browser — your documents never leave your device. This eliminates the risk of PHI exposure during the redaction process itself, a critical consideration for HIPAA compliance.",
    ],
  },
  "ediscovery-document-redaction": {
    title: "eDiscovery Document Redaction Best Practices",
    content: [
      "In legal proceedings, the eDiscovery process often requires producing large volumes of documents. Many of these documents contain privileged information, trade secrets, or personal data that must be redacted before production.",
      "Redaction in eDiscovery serves multiple purposes: protecting attorney-client privilege, shielding confidential business information, and complying with privacy regulations like GDPR and CCPA that may apply even in litigation contexts.",
      "Common mistakes in eDiscovery redaction include: using highlighter tools instead of true redaction, forgetting to remove metadata, inconsistent redaction across document sets, and failing to redact embedded images or form fields.",
      "OfflineRedact supports batch processing — upload multiple PDFs and process them all with consistent redaction rules. This is essential for eDiscovery workflows where hundreds or thousands of documents need uniform treatment.",
      "Best practices: (1) Define redaction categories upfront, (2) Use automated detection to ensure consistency, (3) Always verify with a second reviewer, (4) Maintain a redaction log, (5) Clean metadata from all produced documents.",
    ],
  },
  "gdpr-pdf-compliance": {
    title: "GDPR PDF Compliance: Protecting Personal Data in Documents",
    content: [
      "The General Data Protection Regulation (GDPR) requires organizations to protect personal data of EU residents. PDF documents often contain personal data that must be properly handled — whether for data subject access requests, data sharing agreements, or document retention policies.",
      "Under GDPR, personal data includes any information relating to an identified or identifiable person: names, email addresses, phone numbers, IP addresses, financial information, and more. PDF documents frequently contain multiple categories of personal data.",
      "When responding to data subject access requests (DSARs), organizations may need to provide copies of documents while redacting third-party personal data. This requires careful identification and permanent removal of other individuals' data.",
      "OfflineRedact's multi-regulation support includes a GDPR profile that automatically detects common European personal data patterns: names, email addresses, phone numbers, IBAN numbers, and postal addresses. The tool supports all EU languages.",
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
    notFound();
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
          Ready to try OfflineRedact?
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
