# PDFcensor (OfflineRedact) — Kapsamlı Proje İnceleme Raporu

**Tarih:** 2026-03-03
**İnceleme Kapsamı:** Tüm kaynak kod, API route'ları, bileşenler, hook'lar, PII tespit mantığı, PDF/DOCX işleme, i18n, SEO, güvenlik

---

## 1. KRİTİK HATALAR (Veri Kaybı / Güvenlik Açığı)

### 1.1 TC Kimlik Doğrulayıcı — Negatif Modülo Hatası
- **Dosya:** `src/lib/pii/validators/tc-kimlik.ts:16`
- **Sorun:** JavaScript `%` operatörü negatif sayılarda negatif döndürür. `evenSum > oddSum * 7` olduğunda geçerli TC Kimlik numaraları yanlışlıkla reddedilir.
- **Çözüm:** `const d10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;`

### 1.2 PDF Content Stream — Regex İterasyon Sırasında String Mutasyonu
- **Dosya:** `src/lib/pdf/redactor.ts:145-162`
- **Sorun:** `tjArrayRegex` döngüsü içinde `content` değiştiriliyor → `lastIndex` kayması, sonsuz döngü riski. Ayrıca `partialRegex` (g flag) `test()` sonrası `lastIndex` sıfırlanmıyor.
- **Çözüm:** Önce tüm eşleşmeleri toplayın, sonra ters sırada değiştirin. `partialRegex`'te g flag kullanmayın.

### 1.3 PDF Encoding Uyumsuzluğu — Latin-1 Decode / UTF-8 Re-encode
- **Dosya:** `src/lib/pdf/redactor.ts:125,166`
- **Sorun:** Content stream Latin-1 ile decode, UTF-8 ile re-encode → >127 byte karakterler bozulur, geçersiz PDF üretilir.
- **Çözüm:** Latin-1 ile hem decode hem re-encode yapın.

### 1.4 DOCX Redaksiyonu — Ham XML Üzerinde Global Replace
- **Dosya:** `src/lib/docx/redactor.ts:120-128`
- **Sorun:** PII metni sadece `<w:t>` elemanlarında değil tüm XML'de değiştiriliyor → XML yapısı bozulabilir.
- **Çözüm:** `redactXmlContentAdvanced` (satır 137) etkinleştirilmeli, sadece `<w:t>` içini hedeflemeli.

### 1.5 Lisans Doğrulama Bypass — Production'da UUID Kabul
- **Dosya:** `src/app/api/license/validate/route.ts:17-21`
- **Sorun:** Redis yoksa herhangi UUID v4 geçerli lisans olarak kabul ediliyor. `NODE_ENV` kontrolü yok.
- **Çözüm:** Production'da Redis yoksa 503 dönün.

### 1.6 Checkout API — Locale Injection (Open Redirect)
- **Dosya:** `src/app/api/checkout/route.ts:6,27-28`
- **Sorun:** `locale` kullanıcı girdisinden doğrudan Stripe URL'lerine ekleniyor → path traversal ile open redirect.
- **Çözüm:** Locale'i izin listesinde doğrulayın.

---

## 2. ÖNEMLİ HATALAR (Fonksiyonel Sorunlar)

### 2.1 DOCX Parser charOffset Hatalı Hesaplama
- **Dosya:** `src/lib/docx/parser.ts:85-90`
- **Sorun:** Boş paragraflar charOffset'i artırıyor ama fullText'e katkı yapmıyor → PII konumları kayıyor.

### 2.2 DOCX XML Entity Decode Eksik
- **Dosya:** `src/lib/docx/parser.ts:80`
- **Sorun:** `&amp;`, `&lt;` gibi entity'ler decode edilmiyor → PII tespiti yanlış metin üzerinde çalışıyor.

### 2.3 Görsel-Sadece Redaksiyon Sessiz Fallback
- **Dosya:** `src/lib/pdf/redactor.ts:192-194`
- **Sorun:** Content stream manipülasyonu başarısız → sadece console.warn + siyah dikdörtgen. Orijinal metin çıkarılabilir durumda.

### 2.4 Lisans Anahtarı Müşteriye Ulaşmıyor
- **Dosya:** `src/app/api/webhook/route.ts:42-49`, `src/app/[locale]/success/page.tsx:16`
- **Sorun:** Webhook gerçek anahtar oluşturuyor ama success sayfası sahte `demo-` key gösteriyor.

### 2.5 useLicense — localStorage'dan Doğrulamadan Pro Kabul
- **Dosya:** `src/hooks/useLicense.ts:23-35`
- **Sorun:** Sunucu validasyonu yapılmadan isPro: true ayarlanıyor → DevTools ile bypass edilebilir.

### 2.6 Batch DOCX Redaksiyonu Confirmed Durumunu Yok Sayıyor
- **Dosya:** `src/hooks/useBatchProcessor.ts:274-295`
- **Sorun:** PDF: tümü zorla confirmed. DOCX: tüm match'ler gönderiliyor. Kullanıcının reject'leri dikkate alınmıyor.

---

## 3. PERFORMANS SORUNLARI

### 3.1 OCR: PDF Her Sayfa İçin Yeniden Parse
- **Dosya:** `src/lib/pdf/ocr.ts:54` → `parser.ts:92`
- 100 sayfalık PDF, OCR için 100 kez yeniden yükleniyor.

### 3.2 ArrayBuffer.slice(0) Gereksiz Kopyalama
- **Dosya:** `src/lib/pdf/parser.ts:23,93`
- Her çağrıda tüm PDF kopyalanıyor. 100MB PDF = +100MB ek bellek.

### 3.3 Batch: Tüm Dosyalar Bellekte
- **Dosya:** `src/hooks/useBatchProcessor.ts`
- fileResults tüm ArrayBuffer'ları tutuyor. 10×50MB = ~1GB+.

### 3.4 Eksik Memoization
- **Dosyalar:** `PDFViewer.tsx:102`, `RedactionControls.tsx:79-87`
- pageRedactions, allPiiTypes, piiTypeLabels her render'da yeniden hesaplanıyor.

---

## 4. UI/UX SORUNLARI

### 4.1 Dokunmatik Ekran Desteği Yok
- Tüm etkileşim mouse-only. Mobil/tablet kullanamaz.

### 4.2 Dosya Boyutu Limiti Yok
- **Dosya:** `PDFDropzone.tsx`
- Sınırsız boyutta dosya kabul ediliyor.

### 4.3 onMouseLeave ile Sürükleme Kesilmesi
- **Dosya:** `PDFViewer.tsx:321`
- Mouse overlay dışına çıkınca işlem yarıda bitiyor.

### 4.4 Redact Butonu Onaylanmamış Sayı Gösteriyor
- **Dosya:** `RedactionControls.tsx:388-391`
- confirmedCount yerine redactions.length gösteriliyor.

### 4.5 Async İşlem İptali Yok
- Reset sırasında devam eden işlem state'i bozabilir.

---

## 5. GÜVENLİK

### 5.1 Rate Limiting Yok
- `/api/checkout`, `/api/license/validate`, `/api/webhook` açık.

### 5.2 StructuredData XSS
- **Dosya:** `StructuredData.tsx:9`
- `dangerouslySetInnerHTML` ile `</script>` injection riski.

### 5.3 Hassas Veri Loglama
- **Dosya:** `webhook/route.ts:49`
- Lisans anahtarı ve e-posta console.log ile loglanıyor.

---

## 6. PII TESPİT KALİTESİ

- SSN sadece tire formatı (`XXX-XX-XXXX`), boşluksuz/boşluklu tespit edilmiyor
- IBAN regex çok kısıtlayıcı (Norveç 15 char, Belçika 16 char kaçırılıyor)
- Türk pasaportu regex çok geniş (`[A-Z]\d{6}`) → false positive yüksek
- ALL CAPS isim tespiti ("NOTE IMPORTANT" gibi) → false positive
- GDPR'da `creditCard` pattern eksik

---

## 7. SEO

- Blog, pricing, privacy, terms, success, redact sayfalarında `generateMetadata` yok
- Blog sayfaları sitemap'te yok
- `lastModified` her zaman `new Date()` → crawl budget israfı
- Domain hardcoded (robots.ts, sitemap.ts)

---

## 8. i18n

- privacy, terms, success, blog, not-found sayfaları hardcoded İngilizce
- Pricing'de "Popular" badge hardcoded
- Locale listesi middleware.ts, navigation.ts ve config.ts'de ayrı ayrı tanımlı
- not-found.tsx kendi `<html>/<body>` oluşturuyor (conflict)

---

## 9. KOD KALİTESİ

- Modül seviyesi mutable ID counter'lar (3 hook + ocr.ts) → ID çakışması riski
- PII bounding box hesaplama usePDFProcessor ve useBatchProcessor'da duplike
- cleanMetadata redactor.ts ve metadata-cleaner.ts'de birebir aynı
- allPiiTypes 3 farklı dosyada tekrar
- RedactionControls ve DocxRedactionControls %90 aynı
- pendingAutoScan ref hiç kullanılmıyor (dead code)
- redactXmlContentAdvanced var ama hiç çağrılmıyor

---

## ÖNCELİK ÖZETİ

| Öncelik | Sayı | Kategori |
|---------|------|----------|
| KRİTİK | 6 | TC Kimlik, PDF stream, encoding, DOCX XML, lisans bypass, locale injection |
| ÖNEMLİ | 6 | DOCX offset, XML entity, sessiz fallback, lisans teslimi, localStorage, batch |
| PERFORMANS | 4 | OCR reload, ArrayBuffer kopya, batch bellek, memoization |
| UI/UX | 5 | Touch yok, dosya limiti, sürükleme, buton sayısı, iptal yok |
| GÜVENLİK | 3 | Rate limiting, XSS, log sızıntısı |
| PII | 5 | SSN format, IBAN regex, pasaport FP, isim FP, GDPR CC |
| SEO | 7 | Metadata (5 sayfa), sitemap, domain |
| i18n | 6 | Hardcoded EN, tekrarlı config |
| KOD | 7 | Global state, duplike kod, dead code |
