# Auth Sistemi Implementasyon Planı — Supabase

## Mimari Kararlar

| Karar | Seçim | Neden |
|-------|-------|-------|
| Auth Provider | Supabase Auth | Bedava, Google + Magic Link + Email/Password dahili |
| Database | Supabase PostgreSQL | Bedava 500MB, ilişkisel model, Row Level Security |
| Session Yönetimi | Supabase SSR (@supabase/ssr) | Next.js App Router + middleware desteği |
| Lisans Bağlama | Supabase DB `licenses` tablosu | Kullanıcı hesabına otomatik bağlama |
| Mevcut Redis | Korunur (cache amaçlı) | Kırılma değişikliği yapılmaz |

## Yeni Bağımlılıklar

```
@supabase/supabase-js  — Supabase client SDK
@supabase/ssr          — Next.js SSR cookie-based auth
```

## Veritabanı Şeması (Supabase PostgreSQL)

```sql
-- Supabase Auth zaten auth.users tablosunu yönetir
-- Biz sadece public şemaya ek tablolar ekliyoruz:

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  is_pro boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.licenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  key text unique not null,
  email text not null,
  active boolean default true,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- RLS politikaları
alter table public.profiles enable row level security;
alter table public.licenses enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can read own licenses"
  on public.licenses for select using (auth.uid() = user_id);
```

## Dosya Yapısı (Yeni/Değişen)

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser client (createBrowserClient)
│       ├── server.ts          # Server client (createServerClient)
│       └── middleware.ts       # Middleware client (updateSession)
├── hooks/
│   └── useAuth.ts             # Client-side auth hook (useAuth)
├── components/
│   └── auth/
│       ├── AuthButton.tsx     # Header'daki Login/Avatar dropdown
│       ├── LoginForm.tsx      # Email + password + magic link + Google
│       └── AuthProvider.tsx   # Supabase auth state context
├── app/
│   ├── [locale]/
│   │   ├── login/
│   │   │   └── page.tsx       # Login sayfası
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts   # OAuth/Magic link callback
│   │   └── account/
│   │       └── page.tsx       # Hesap sayfası (lisans durumu)
│   └── api/
│       ├── checkout/route.ts  # [GÜNCELLE] userId ekle
│       └── webhook/route.ts   # [GÜNCELLE] lisansı Supabase'e kaydet + user'a bağla
middleware.ts                   # [GÜNCELLE] next-intl + Supabase session refresh
```

## Adım Adım Implementasyon

### Adım 1: Supabase SDK Kurulumu
- `@supabase/supabase-js` ve `@supabase/ssr` paketlerini ekle
- `.env.local.example`'a `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` ekle
- `src/lib/supabase/client.ts` — createBrowserClient
- `src/lib/supabase/server.ts` — createServerClient (cookies ile)
- `src/lib/supabase/middleware.ts` — updateSession helper

### Adım 2: Middleware Güncelleme
- `middleware.ts`'yi güncelle: Supabase session refresh + next-intl routing birleştir
- Supabase middleware session'ı yeniler (cookie refresh), ardından next-intl locale routing'i çalışır
- Protected route'lar: `/redact`, `/account` → login'e yönlendir

### Adım 3: Auth UI Komponentleri
- `AuthProvider.tsx` — Supabase auth state listener, context provider
- `LoginForm.tsx` — 3 yöntem: Google butonu, magic link email input, email+password form
- `AuthButton.tsx` — Header'a eklenecek: giriş yapmamışsa "Login" butonu, yapmışsa avatar dropdown (Account, Logout)

### Adım 4: Login & Callback Sayfaları
- `src/app/[locale]/login/page.tsx` — LoginForm'u render eder
- `src/app/[locale]/auth/callback/route.ts` — OAuth/magic link dönüş noktası, code → session exchange

### Adım 5: Account (Hesap) Sayfası
- `src/app/[locale]/account/page.tsx` — Profil bilgileri, lisans durumu (Free/Pro), lisans anahtarı
- Protected route (giriş yapmamış → login'e yönlendir)

### Adım 6: Header Güncelleme
- `Header.tsx`'e `AuthButton` ekle
- Navigation'a "Account" linki ekle (giriş yapmışsa)

### Adım 7: Stripe Entegrasyonu Güncelleme
- `checkout/route.ts`: Stripe session metadata'ya `userId` ekle
- `webhook/route.ts`: Lisansı Supabase DB'ye kaydet, `user_id` ile eşleştir (email match)
- Success sayfasını güncelle: Sahte key yerine "Hesabınız aktifleştirildi" mesajı

### Adım 8: useAuth Hook
- `useAuth.ts`: Supabase session + profile + isPro durumunu birleştiren hook
- `useLicense.ts`'nin yerini alır

### Adım 9: Protected Routes & Pro Gate
- Redact sayfasında: Auth kontrolü (giriş gerekli), Pro durumuna göre watermark/batch kısıtlaması
- Mevcut `useLicense` referanslarını `useAuth`'a geçir

### Adım 10: Temizlik
- Eski `useLicense.ts` hook'u deprecated/kaldır
- `api/license/validate` route'u deprecated (geriye uyumluluk için bir süre tut)

## Akış Diyagramları

### Kayıt + Satın Alma Akışı
```
Kullanıcı → Login sayfası → Google/Magic Link/Email ile kayıt
→ Hesap oluşur → /pricing sayfası → "Buy Pro" butonu
→ Stripe Checkout (email otomatik dolu) → Ödeme
→ Stripe Webhook → Supabase'de license oluştur + profile.is_pro = true
→ Success sayfası: "Pro hesabınız aktif!"
→ /redact sayfası: Tüm Pro özellikler açık
```

### Login Akışı (Mevcut Kullanıcı)
```
Kullanıcı → Login sayfası → Google/Magic Link/Email+Password
→ Supabase Auth → Session cookie set
→ Middleware session'ı yeniler → /redact'e yönlendir
→ useAuth hook: isPro kontrol → Pro özellikler açık/kapalı
```

## Ortam Değişkenleri (Yeni)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...  # Sadece webhook/server tarafı
```

## Supabase Dashboard Yapılandırması (Manuel)
1. Auth → Providers → Google OAuth aktifleştir (Google Cloud Console'dan client ID/secret)
2. Auth → Email → Magic Link aktifleştir
3. Auth → Email → Email+Password aktifleştir (varsayılan)
4. Auth → URL Configuration → Site URL ve redirect URL'leri ayarla
5. SQL Editor → Yukarıdaki schema SQL'ini çalıştır
6. Database → Triggers → `on auth.users insert` → profiles tablosuna otomatik kayıt oluştur
