# CLAUDE.md — PDFcensor Proje Talimatları

## Otomatik Git Push Kuralı

Her görev tamamlandığında değişiklikler **otomatik olarak `main` branch'ine** push edilmelidir.

### Adımlar (her görev sonunda):

1. Değişiklikleri stage'e al: `git add <ilgili dosyalar>`
2. Commit oluştur (açıklayıcı mesajla): `git commit -m "..."`
3. Main'e push et: `git push -u origin main`

> **Not:** Push işlemi başarısız olursa üstel geri çekilme ile 4 kez yeniden dene (2s, 4s, 8s, 16s).

---

## Proje Hakkında

**PDFcensor** — PDF dosyalarındaki hassas içerikleri tespit eden ve sansürleyen Next.js uygulaması.

### Teknoloji Yığını

- **Framework:** Next.js (TypeScript)
- **Stil:** Tailwind CSS
- **Linter:** ESLint

### Dizin Yapısı

```
src/          # Kaynak kodlar
public/       # Statik dosyalar
middleware.ts # Next.js middleware
```

---

## Geliştirme Kuralları

- Değişiklik yapmadan önce ilgili dosyaları oku.
- Gereksiz dosya oluşturma; mevcut dosyaları düzenle.
- Aşırı mühendislikten kaçın; sadece istenen değişikliği yap.
- Güvenlik açığı oluşturacak kod yazma (XSS, injection vb.).

---

## Düzeltme Yapılacaklar (Öncelik Sırasıyla)

### Tamamlananlar

- [x] ~~TC Kimlik negatif modülo~~ — `tc-kimlik.ts:16` — `((x % 10) + 10) % 10` ile düzeltildi
- [x] ~~PDF content stream regex mutasyonu + Latin-1/UTF-8 encoding~~ — `pdf/redactor.ts` — Ters sıralı replace + Latin-1 re-encode
- [x] ~~Görsel-sadece redaksiyon sessiz fallback~~ — `pdf/redactor.ts` — Hedefli kaldırma başarısız olunca `stripAllTextFromPage()` tüm BT..ET bloklarını siliyor
- [x] ~~Lisans doğrulama bypass~~ — `license/validate/route.ts` — Redis yoksa 503 döndürüyor (UUID kabul kaldırıldı)
- [x] ~~Lisans anahtarı müşteriye ulaşmıyor~~ — Anonim ödeme kapatıldı, checkout auth zorunlu, Pro `profiles.is_pro` üzerinden çalışıyor (ayrı key sistemi gereksizdi)

### KRİTİK — Güvenlik / Veri Kaybı

- [ ] **Checkout locale injection (Open Redirect)** — `src/app/api/checkout/route.ts:32` — `locale` doğrulanmadan Stripe URL'lerine ekleniyor
- [ ] **StructuredData XSS** — `src/components/seo/StructuredData.tsx:9` — `dangerouslySetInnerHTML` ile `</script>` injection riski

### ÖNEMLİ — Fonksiyonel Hatalar

- [ ] **DOCX XML üzerinde global replace** — `src/lib/docx/redactor.ts:120-128` — PII sadece `<w:t>` içinde değil tüm XML'de değiştiriliyor
- [ ] **DOCX charOffset hatalı hesaplama** — `src/lib/docx/parser.ts:85-90` — Boş paragraflar offset'i bozuyor
- [ ] **DOCX XML entity decode eksik** — `src/lib/docx/parser.ts:80` — `&amp;`, `&lt;` decode edilmiyor
- [ ] **`redactXmlContentAdvanced` hiç çağrılmıyor** — `src/lib/docx/redactor.ts:41,137` — Cross-run PII redaksiyonu çalışmıyor
- [ ] **Lisans anahtarı müşteriye ulaşmıyor** — `src/app/[locale]/success/page.tsx:16` — Sahte `demo-` key gösteriliyor
- [x] ~~Webhook idempotency kontrolü yok~~ — Zaten `checkSessionProcessed`/`markSessionProcessed` ile Redis'te mevcut (30 gün TTL)
- [ ] **`useTranslations` server component'te** — `src/app/[locale]/page.tsx:1` — `"use client"` veya `getTranslations` gerekli
- [ ] **Blog 404 yerine 200 dönüyor** — `src/app/[locale]/blog/[slug]/page.tsx:48-59` — `notFound()` çağrılmıyor
- [ ] **Batch DOCX confirmed durumunu yok sayıyor** — `src/hooks/useBatchProcessor.ts:274-295` — Kullanıcının reject'leri dikkate alınmıyor
- [ ] **DocxViewer tooltip PII'yi açığa çıkarıyor** — `src/components/docx/DocxViewer.tsx:126-127` — Hover'da orijinal metin görünüyor
- [ ] **DocxViewer örtüşen redaksiyon bozulması** — `src/components/docx/DocxViewer.tsx:36-74` — Overlapping redaction'lar segmentleri bozuyor

### PERFORMANS

- [ ] **OCR: PDF her sayfa için yeniden parse** — `src/lib/pdf/ocr.ts:54`, `parser.ts:92` — 100 sayfa = 100x parse
- [x] ~~ArrayBuffer.slice(0) gereksiz kopyalama~~ — `parser.ts` — `getDocumentArrayBuffer`/`getDocxArrayBuffer` lazy load + cache
- [x] ~~Batch tüm dosyaları bellekte tutuyor~~ — `useBatchProcessor.ts` — PII sonrası ağır veri serbest, redaksiyon File ref'ten lazy re-load
- [ ] **Eksik memoization** — `PDFViewer.tsx`, `RedactionControls.tsx` — pageRedactions, allPiiTypes her render'da hesaplanıyor

### UI/UX

- [x] ~~Dosya boyutu limiti yok~~ — Bellek optimizasyonu ile çözüldü (lazy load + scan sonrası release); limit konmadı, büyük dosyalar destekleniyor
- [ ] **LanguageSwitcher mousedown/click race** — `src/components/layout/LanguageSwitcher.tsx:16-24,46` — Dropdown seçim yapılamadan kapanıyor
- [ ] **PDFViewer overlayRef non-null assertion** — `src/components/pdf/PDFViewer.tsx:108` — Ref null iken crash
- [ ] **Redact butonu yanlış sayı gösteriyor** — `src/components/RedactionControls.tsx:388-391` — confirmedCount yerine toplam gösteriliyor
- [ ] **onMouseLeave sürükleme kesilmesi** — `src/components/pdf/PDFViewer.tsx:321` — Mouse dışına çıkınca işlem yarıda kalıyor

### SEO / i18n

- [ ] **Blog sitemap'te yok** — `src/app/sitemap.ts:6`
- [ ] **Sayfalarda generateMetadata eksik** — pricing, redact, blog, success, privacy, terms
- [ ] **Hardcoded İngilizce sayfalar** — privacy, terms, success, blog, not-found
- [ ] **Locale listesi 3 yerde tekrar** — `middleware.ts`, `navigation.ts`, `config.ts`
- [ ] **Hassas veri loglama** — `src/app/api/webhook/route.ts:49` — Lisans + email console.log
- [ ] **Rate limiting yok** — `/api/checkout`, `/api/license/validate`, `/api/webhook`

### KOD KALİTESİ

- [ ] **Global mutable ID counter** — `usePDFProcessor.ts:20-23` — ID çakışma riski
- [ ] **Duplike PII bounding box hesaplama** — `usePDFProcessor.ts` vs `useBatchProcessor.ts`
- [ ] **Duplike cleanMetadata** — `redactor.ts` vs `metadata-cleaner.ts`
- [ ] **RedactionControls / DocxRedactionControls %90 aynı** — Ortak component çıkarılabilir
- [ ] **Dead code: pendingAutoScan ref** — Hiç kullanılmıyor
- [ ] **Dead code: `useLicense` hook + `/api/license/validate`** — Hiçbir component tarafından kullanılmıyor, Pro kontrolü `AuthProvider.is_pro` ile yapılıyor
- [ ] **IBAN regex çok kısıtlayıcı** — `src/lib/pii/patterns/global.ts:32` — 15-16 char IBAN'lar kaçırılıyor
- [ ] **İsim tespiti false positive** — `src/lib/pii/patterns/names.ts` — ALL CAPS kelimeler isim sanılıyor
