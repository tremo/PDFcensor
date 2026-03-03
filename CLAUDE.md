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
