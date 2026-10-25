# Butamsenlik e-ticaret: referans analizi ve teknik mimari

Tarih: 25 Ekim 2026

## 0. Referans siteye erişim durumu (önce bunu okuyun)

| Deneme | Sonuç |
|---|---|
| Tarayıcı / `curl` ile `https://www.handeliaksesuar.com/` | **Erişilemedi.** Bu çalışma ortamının ağ kuralı alan adını engelledi (proxy 403). |
| Web sayfası okuma aracı ile ana sayfa, ürün sayfası, `handeliaksesuar.com` | **Erişilemedi.** Alan adı çözülemedi (`ENOTFOUND`). |
| web.archive.org arşivi | **Erişilemedi.** Araç bu alan adına izin vermedi. |
| Arama motoru | Yalnızca arama sonucu başlıkları ve özetleri alındı. Bu sayfalar tarayıcıyla açılmadı. |

**Sonuç:** Referans sitenin sayfaları bu çalışmada açılıp incelenemedi. Aşağıda “gözlem” olarak geçen her şey, yalnızca ikinci el kaynaklara dayanıyor:

- daha önce sizin paylaştığınız ana sayfa ekran görüntüsünden ölçülen renkler (`docs/design-dna.json`, 23.10.2026),
- arama sonuçlarında görünen başlıklar ve özetler.

Ürün detay sayfası, arama, filtreleme, sepet, üyelik ve mobil menü **incelenemedi**. Bu nedenle bu alanlarda referansla ilgili hiçbir iddiada bulunulmadı.

## 1. Referans sitenin tasarım sistemi

**Ekran görüntüsünden ölçülen (doğrulanmış, tek ekran görüntüsüyle sınırlı):**
- Siyaha yakın duyuru ve menü şeritleri (`#02070f`), şeftali tonlu üst kampanya bandı (`#f9e5d3`), krem kahraman alanı (`#efead9`), altın tonlu el yazısı logo (`#e8dab3`).
- Geri sayım ve kayan yazılı kampanyalar, tam genişlikte fotoğraf kaydırıcı, WhatsApp butonu.

**Yeni projede uygulanan (özgün):** sıcak zemin (`#f6f1ec`), pudra / adaçayı / sis / kum yüzeyler, espresso mürekkep (`#34292a`), altın vurgu; Cormorant Garamond + Manrope yazı tipleri; tamamen yuvarlak butonlar; gölgesiz, ton farkıyla ayrılan kartlar. Geri sayım ile baskı kurma tercih edilmedi.

## 2. Sayfa ve kategori mimarisi

**Arama özetlerinden (kısmen doğrulanmış):** Bileklik, kolye, küpe, yüzük, kişiye özel ürünler. Bir arama özetinde güneş gözlüğü ve saatten de söz ediliyor. Bir ürün adresi kök dizinde, ürün adından türetilmiş: `/ince-mirror-model-gold-altin-kaplama-celik-bileklik`. Bir `/blog` sayfası var. Google Play’de “Handeli Aksesuar” uygulaması var; yayıncı olarak QUKA Yazılım görünüyor.

**Doğrulanamadı:** menü ve alt kategori yapısı, filtre türleri, sayfalama yöntemi.

**Yeni projede:** 8 ana kategori, 22 alt kategori (iki seviye). Adresler: `/kategori/{slug}`, `/urun/{slug}`, `/koleksiyon/{slug}`, `/urunler`, `/arama`, `/sayfa/{slug}`.

## 3. Ürün listeleme ve ürün detay yapısı (yeni proje, öneri olarak uygulandı)

- Kare (1:1) ürün görseli, indirim yüzdesi, “Yeni”, “Tükendi”, “Kişiye özel”, “Son X ürün” etiketleri; eski fiyat üstü çizili, yeni fiyat kırmızı.
- Basit ürünlerde karttan doğrudan “Sepete ekle”, seçenekli ürünlerde “Seçenekleri gör”.
- Detay sayfası: galeri, seçenek (renk / uzunluk / numara), harf veya isim alanı, adet, stok durumu, kargo ve iade bilgisi, açıklama ve özellikler, benzer ürünler, mobilde altta sabit satın alma çubuğu, arama motorları için yapılandırılmış ürün bilgisi (schema.org JSON-LD).

## 4. Alışveriş özellikleri

Arama (Türkçe karakterlere duyarsız), fiyat aralığı, renk/metal, stok ve indirim filtreleri, 6 sıralama seçeneği, sayfalama, aktif filtre etiketleri; sepet, indirim kodu, ücretsiz kargo eşiği, misafir veya üye olarak sipariş, sipariş takibi, favoriler.

## 5. Mobil deneyim

Referansın mobil hâli **incelenemedi**. Yeni projede: soldan açılan çekmece menü ve akordeon alt kategoriler, tam genişlikte arama kutusu, 2 sütunlu ürün ızgarası, açılır filtre paneli, ürün sayfasında sabit satın alma çubuğu, en az 44 px dokunma alanları, 16 px form yazısı (iOS’ta sayfanın kendiliğinden yakınlaşmasını önler).

## 6. Örnek alınan kararlar

Kampanya duyuru bandı, menüde kategori ağırlığı, indirim ve eski fiyat gösterimi, kişiye özel ürünlerin ayrı kategori olarak sunulması (hepsi ekran görüntüsünde ve arama özetlerinde görülen, sektörde de yaygın kalıplar).

## 7. İyileştirilebilecek noktalar

Arama özetlerinde, Şikayetvar’daki bazı şikâyet başlıkları görüldü: kararma, iade sırasında kesilen kargo ücreti, kampanya hediyesinin gelmemesi. Bu sayfalar açılmadı; özetteki puan (14 şikâyetten 29/100) küçük bir örneklemdir. Bu başlıklardan çıkan tasarım önerileri:

- İade koşulları ürün sayfasında görünsün (uygulandı; içerik işletme tarafından doldurulmalı).
- Hediye veya kampanya içeriği sipariş özetinde açıkça yazsın (kupon satırı var; “hediye ürün” özelliği yok, ileride eklenebilir).
- Malzeme açıklamasında doğrulanmamış dayanıklılık iddialarına yer verilmesin (demo metinler bu kurala göre yazıldı).

## 8. Teknik mimari

Next.js 16 (App Router, sunucu bileşenleri, sunucu eylemleri), TypeScript, Tailwind CSS 4, Prisma 7 + SQLite (geliştirme; PostgreSQL’e geçirilebilir), bcrypt ile şifre özeti, veritabanında tutulan oturumlar, zod ile doğrulama. Ayrıntılar `shop/README.md` dosyasında.

## 9. Eksik bilgiler ve dış servisler

| Gerekli | Neden | Durum |
|---|---|---|
| İşletme unvanı, adres, vergi no, MERSİS, iletişim | Yasal sayfalar, fatura | Girilmedi (yönetim panelinden) |
| Hukukçu incelemesi | KVKK, mesafeli satış, ön bilgilendirme, iade metinleri | Yalnızca şablon var |
| Ödeme kuruluşu hesabı (ör. iyzico, PayTR) + API anahtarları | Kartla ödeme | Entegre edilmedi |
| E-posta servisi (ör. Resend) API anahtarı | Şifre sıfırlama e-postası | Kod hazır, test edilmedi |
| Kargo firması anlaşması | Kargo süresi ve takip | Yok |
| Gerçek ürün fotoğrafları ve kullanım izni | Ürün görselleri | Yok; temsilî çizimler kullanıldı |
| Gerçek ürün, fiyat ve stok bilgisi | Katalog | 33 demo ürün var |
| Alan adı ve barındırma (hosting) | Yayın | Yok |
