# Butamsenlik Mağaza (e-ticaret sitesi)

Takı ve aksesuar satışı için tam bir e-ticaret sitesi: mağaza, sepet, ödeme adımı, üyelik ve yönetim paneli.

> **Durum:** Demo. Ürünler, fiyatlar ve stoklar örnektir. Kartla ödeme bağlı değil. Yasal metinler yalnızca şablondur. Gerçek satışa geçmeden önce aşağıdaki “Canlıya geçiş” listesini tamamlayın.

## İçindekiler
1. Neler var
2. Teknoloji ve mimari
3. Dosya yapısı
4. Bilgisayarda çalıştırma
5. Ortam değişkenleri
6. Testler
7. Veritabanı ve yayına alma
8. Gerçek ödeme ve sipariş almak için yapılacaklar
9. Bilinen eksikler

## 1. Neler var

**Mağaza:** kampanya duyuru bandı, açılır kategori menüsü, mobil menü, arama, öne çıkan alanlar (banner), kategori tanıtımları, yeni gelenler, koleksiyonlar, indirimdeki ürünler, çok satanlar (yalnızca gerçek satış olunca görünür), marka alanı, bülten, kapsamlı alt bilgi (footer).

**Listeleme:** kategori ve alt kategori, fiyata / yeniliğe / çok satana göre sıralama, fiyat aralığı, renk / metal, “stokta olanlar”, “indirimli” filtreleri, aktif filtre etiketleri ve temizleme, sayfalama.

**Ürün sayfası:** galeri, fiyat, indirim oranı, stok durumu, seçenekler (renk / uzunluk / numara), harf veya isim kişiselleştirme, adet, sepete ekle, favori, kargo ve iade bilgisi, benzer ürünler, mobilde sabit satın alma çubuğu.

**Sepet ve ödeme:** ekleme, çıkarma, adet değiştirme, indirim kodu, ücretsiz kargo eşiği, misafir veya üye siparişi, teslimat ve fatura (bireysel / kurumsal) bilgileri, sözleşme onayı, ödeme yöntemleri:
- **Havale / EFT** (gerçek kullanılabilir): yönetim panelinde IBAN girilince açılır. Ödemeyi yönetici onaylar.
- **Demo ödeme** (yalnızca TEST): kart bilgisi istemez, para çekmez, siparişi “TEST” olarak işaretler.

**Üyelik:** üye olma, giriş, güvenli şifre sıfırlama (30 dakikalık, tek kullanımlık bağlantı), profil, şifre değiştirme, adres defteri, sipariş geçmişi, favoriler.

**Kurumsal sayfalar:** Hakkımızda, İletişim (form ile), SSS, Kargo ve teslimat, İade ve değişim, Gizlilik, KVKK, Ön bilgilendirme, Mesafeli satış. Yasal olanlar **şablondur**: işletme bilgileri ve hukukçu incelemesi gerekir.

**Yönetim paneli (`/admin`):** özet ve canlıya geçiş uyarıları; ürün ekleme / düzenleme / silme; görsel yükleme; seçenek ve stok; kategori ve alt kategori; indirim kodları ve kategoriye toplu indirim; siparişler ve durum güncelleme (iptalde stok geri eklenir); müşteriler (görüntüleme, pasif yapma); banner, koleksiyon ve mağaza ayarları; iletişim mesajları; bülten listesini CSV olarak indirme.

## 2. Teknoloji ve mimari

| Parça | Seçim | Neden |
|---|---|---|
| Çatı | Next.js 16 (App Router) + React 19 | Sayfalar sunucuda hazırlanır (hızlı ve arama motoru dostu); formlar sunucu eylemleriyle çalışır |
| Dil | TypeScript | Hataları erkenden yakalar |
| Tasarım | Tailwind CSS 4 + `src/app/globals.css` içindeki tasarım sistemi | Tutarlı renk, yazı ve buton kuralları |
| Veritabanı | Prisma 7 + SQLite | Kurulum gerektirmez; PostgreSQL’e geçirilebilir |
| Şifre | bcrypt (12 tur) | Şifrenin kendisi saklanmaz |
| Doğrulama | zod | Tüm form verisi sunucuda kontrol edilir |

**Güvenlik kararları**
- Fiyat, stok ve indirim **her zaman sunucuda** yeniden hesaplanır. Tarayıcıdan gelen fiyata güvenilmez.
- Stok, sipariş anında koşullu güncellemeyle ayrılır: iki kişi aynı anda son ürünü alamaz.
- Yönetici kontrolü yalnızca arayüzde değil, **her yönetim sayfasında ve her yönetim eyleminde sunucuda** yapılır (`requireAdmin()`). Testte, normal üyenin yönetim eylemini doğrudan çağırma denemesi etkisiz kaldı.
- Oturum çerezi `httpOnly` ve `sameSite=lax`; canlıda `secure`. Veritabanında çerezin kendisi değil, özeti (SHA-256) tutulur.
- Giriş, üyelik, şifre sıfırlama, iletişim ve bülten için deneme sınırı var.
- Şifre sıfırlama, e-postanın kayıtlı olup olmadığını belli etmez.
- Görsel yüklemede dosya türü dosyanın içinden kontrol edilir; yalnızca JPG, PNG ve WebP kabul edilir (SVG reddedilir), en fazla 5 MB.
- Misafir sipariş sayfası yalnızca gizli bağlantıyla açılır.
- Güvenlik başlıkları: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

## 3. Dosya yapısı

```
shop/
├─ prisma/
│  ├─ schema.prisma        veritabanı şeması (ürün, kategori, kullanıcı, sipariş …)
│  ├─ migrations/          veritabanı değişiklik geçmişi
│  └─ seed.ts              demo veriyi yükler
├─ prisma.config.ts
├─ public/demo/            temsilî takı çizimleri (fotoğraf değil)
├─ scripts/                demo görsel üretici, yönetici oluşturma
├─ storage/uploads/        yönetim panelinden yüklenen görseller (git’e girmez)
├─ src/
│  ├─ app/
│  │  ├─ (shop)/           mağaza sayfaları (ana sayfa, kategori, ürün, sepet, ödeme, hesabım …)
│  │  ├─ admin/            yönetim paneli ve eylemleri (_actions/)
│  │  ├─ actions/          mağaza eylemleri (sepet, üyelik, ödeme …)
│  │  ├─ media/[file]/     yüklenen görselleri sunar
│  │  ├─ globals.css       tasarım sistemi
│  │  ├─ sitemap.ts, robots.ts
│  ├─ components/          tekrar kullanılan parçalar (ürün kartı, menü, filtre …)
│  ├─ content/pages.tsx    kurumsal / yasal sayfa şablonları
│  └─ lib/                 iş kuralları (fiyat hesabı, sepet, sipariş, oturum, ödeme …)
└─ tests/                  birim testleri ve tarayıcı testleri (e2e/)
```

## 4. Bilgisayarda çalıştırma

Gerekenler: **Node.js 22** veya üstü (https://nodejs.org adresinden “LTS” sürümü).

Terminal (Windows’ta “Komut İstemi” veya “PowerShell”) açıp sırayla yazın:

```bash
cd shop
npm install                 # paketleri indirir (bir kez)
cp .env.example .env        # Windows: copy .env.example .env
```

`.env` dosyasını bir metin düzenleyiciyle açın ve **`SEED_ADMIN_PASSWORD`** değerini kendi güçlü şifrenizle değiştirin (en az 10 karakter). Sonra:

```bash
npx prisma migrate deploy   # veritabanını oluşturur
npm run db:seed             # demo ürünleri ve yönetici hesabını yükler
npm run dev                 # siteyi başlatır
```

Tarayıcıda **http://localhost:3000** adresini açın. Yönetim paneli: **http://localhost:3000/admin** (`.env` içindeki yönetici e-postası ve şifresiyle girin).

Geliştirme sırasında şifre sıfırlama e-postası gönderilmez; bağlantı terminalde `[DEV MAIL]` başlığıyla yazılır.

Yeni bir yönetici eklemek veya şifresini değiştirmek için:
```bash
npm run admin:create -- eposta@ornek.com "Guclu-Sifre-123" "Ad Soyad"
```

## 5. Ortam değişkenleri

| Değişken | Ne işe yarar | Örnek |
|---|---|---|
| `DATABASE_URL` | Veritabanı adresi | `file:./dev.db` |
| `APP_URL` | Sitenin adresi (e-posta bağlantıları, site haritası) | `https://butamsenlik.com` |
| `PAYMENT_PROVIDER` | `demo` = test ödemesi açık; boş = kapalı | canlıda **boş** |
| `RESEND_API_KEY` | Şifre sıfırlama e-postası için | Resend panelinden |
| `MAIL_FROM` | Gönderen adresi | `Butamsenlik <no-reply@alanadiniz.com>` |
| `MAIL_TRANSPORT` | `console` = e-postayı göndermeyip loga yazar (yalnızca test) | canlıda **boş** |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | İlk yönetici hesabı | |
| `UPLOAD_DIR` | Yüklenen görsellerin klasörü | `storage/uploads` |

`.env` dosyası gizlidir; git’e eklenmez.

## 6. Testler

```bash
npm test            # birim testleri: fiyat, kupon, kargo, para biçimi, Türkçe arama (13 test)
npm run lint        # kod kalitesi
npm run typecheck   # tür kontrolü
npm run build       # canlı sürüm derlemesi
npm run test:e2e    # tarayıcı testleri (Playwright gerekir)
```

⚠️ `npm run test:e2e` **yerel `dev.db` veritabanını siler** ve demo veriyle yeniden kurar. Gerçek veri varken çalıştırmayın.

Son çalıştırma sonuçları (25.10.2026, bu geliştirme ortamında):

| Test | Sonuç |
|---|---|
| Birim testleri | 13/13 geçti |
| Mağaza tarayıcı testi (menü, arama, filtre, sıralama, sayfalama, sepet hesabı, kupon, ödeme, demo ödeme, sipariş gizliliği, üyelik, giriş, şifre sıfırlama, adres, favori, iletişim, bülten, ana sayfadaki 70 bağlantı) | 51/51 geçti |
| Yönetim tarayıcı testi (yetki, sahte yönetim isteği, kategori, ürün, görsel yükleme, seçenek, kupon, ayarlar, havale siparişi, stok ayırma ve iptalde geri ekleme, müşteri pasifleştirme, silme, CSV) | 26/26 geçti |
| ESLint, TypeScript, `next build` | Hatasız |
| Mobil (390 px) ve masaüstü (1366 px) ekran görüntüleri | İncelendi; yatay taşma yok |

## 7. Veritabanı ve yayına alma

**En basit yol: tek sunucu (VPS)**, SQLite ile. (Bu yol bu ortamda `npm start` ile test edildi.)
1. Sunucuya Node.js 22 kurun, projeyi kopyalayın.
2. `.env` oluşturun (`APP_URL` = alan adınız, `PAYMENT_PROVIDER` boş).
3. `npm ci && npx prisma migrate deploy && npm run build`
4. İlk kurulumda yönetici için: `npm run admin:create -- …` (demo ürün istemiyorsanız `db:seed` çalıştırmayın).
5. `npm start` komutunu bir süreç yöneticisiyle (ör. pm2 veya systemd) sürekli çalıştırın; önüne HTTPS sağlayan bir sunucu koyun (ör. Caddy veya Nginx).
6. `dev.db` dosyasını ve `storage/uploads` klasörünü düzenli olarak yedekleyin.

**Vercel gibi sunucusuz (serverless) barındırma:** bu ortamlarda disk kalıcı değildir. Bu yüzden:
- PostgreSQL gerekir: `schema.prisma` içinde `provider = "postgresql"`, `@prisma/adapter-pg` paketi, `src/lib/db.ts` içinde adaptör değişikliği ve yeni bir migration.
- Görseller nesne depolamaya (S3, Cloudflare R2, Vercel Blob) taşınmalı (`src/lib/uploads.ts`).
- Deneme sınırı (rate limit) paylaşılan bir depoya (ör. Redis) taşınmalı.

Bu PostgreSQL yolu **bu çalışmada denenmedi**.

## 8. Gerçek ödeme ve sipariş almak için yapılacaklar

1. **İşletme bilgileri:** Yönetim → Vitrin & Ayarlar → İşletme bilgileri.
2. **Yasal metinler:** `src/content/pages.tsx` içindeki şablonları bir hukukçuyla tamamlayın (KVKK, gizlilik, ön bilgilendirme, mesafeli satış, iade).
3. **Ödeme:**
   - Hemen: IBAN girerek Havale / EFT ile satış yapılabilir.
   - Kartla ödeme için bir ödeme kuruluşuyla (ör. iyzico, PayTR) sözleşme ve API anahtarları gerekir. Entegrasyon adımları `src/lib/payments.ts` dosyasının başında yazılı. En önemli kural: ödeme yalnızca ödeme kuruluşunun **imzalı sunucu bildirimi (webhook) doğrulandıktan sonra** “ödendi” sayılmalı.
   - Kart bilgisi asla bu sitede toplanmamalı; ödeme kuruluşunun kendi formu kullanılmalı.
4. `.env` içinde `PAYMENT_PROVIDER` ve `MAIL_TRANSPORT` **boş** olmalı (demo ödeme kapanır, sitedeki “DEMO MAĞAZA” bandı kalkar).
5. **E-posta:** Resend (veya benzeri) hesabı açın, alan adınızı doğrulayın, `RESEND_API_KEY` girin, şifre sıfırlamayı deneyin.
6. **Katalog:** demo ürünleri silin veya pasif yapın; gerçek ürün, fiyat, stok ve **kullanım hakkınız olan** fotoğrafları ekleyin.
7. **Kargo:** ücret ve ücretsiz kargo eşiğini ayarlayın; kargo sayfasındaki boşlukları doldurun.
8. KDV ve fatura (e-Arşiv / e-Fatura) süreçlerini mali müşavirinizle netleştirin; site şu an fatura kesmez.

## 9. Bilinen eksikler

- Kartla ödeme entegrasyonu yok (yukarıya bakın).
- Sipariş durum değişikliğinde müşteriye e-posta gönderilmiyor; sipariş onay e-postası yok.
- Resend e-posta gönderimi API anahtarı olmadığı için **test edilmedi**.
- Görseller temsilî çizimdir; gerçek ürün fotoğrafı yoktur.
- Deneme sınırı tek sunucu belleğinde tutulur (birden fazla sunucuda paylaşılmaz).
- Hediye ürün / “X al Y öde” gibi gelişmiş kampanya türleri yok; yüzde / tutar kuponu ve kategori indirimi var.
- Fatura kesme, kargo firması entegrasyonu ve stok hareket geçmişi yok.
- Erişilebilirlik için temel kontroller yapıldı (tek başlık, alternatif metinler, klavye ile açılan menüler, etiketli form alanları). Otomatik erişilebilirlik denetim aracı (ör. axe) çalıştırılmadı.
