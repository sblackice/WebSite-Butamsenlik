// Corporate / legal pages.
// IMPORTANT: these are STRUCTURE TEMPLATES, not finished legal texts. Bracketed fields come from
// Admin → Vitrin & Ayarlar; everything must be reviewed by a lawyer / financial advisor before going live.
import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { formatTRY } from "@/lib/money";

export type PageDef = { title: string; description: string; legal?: boolean; render: (s: Settings) => React.ReactNode };

const v = (value: string, label: string) =>
  value ? <strong>{value}</strong> : <mark className="rounded bg-warning-soft px-1">[{label} girilmeli]</mark>;

const seller = (s: Settings) => (
  <ul>
    <li>Unvan: {v(s.companyTitle, "İşletme unvanı")}</li>
    <li>Adres: {v(s.companyAddress, "Açık adres")}</li>
    <li>Vergi dairesi / no: {v(s.companyTaxOffice, "Vergi dairesi")} / {v(s.companyTaxNumber, "Vergi no")}</li>
    <li>MERSİS no: {v(s.companyMersis, "MERSİS no (varsa)")}</li>
    <li>E-posta: {v(s.companyEmail, "E-posta")} — Telefon: {v(s.companyPhone, "Telefon")}</li>
  </ul>
);

export const PAGES: Record<string, PageDef> = {
  hakkimizda: {
    title: "Hakkımızda",
    description: "Butamsenlik hakkında.",
    render: (s) => (
      <>
        <p>{s.brandStoryText}</p>
        <p>Bu alan markanın kendi hikâyesiyle doldurulmalıdır: kuruluş, atölye/üretim bilgisi, malzeme seçimi ve müşterilere verilen sözler. Doğrulanmamış iddialara (ör. “alerji yapmaz”, “kararmaz”) yer verilmemelidir.</p>
      </>
    ),
  },
  iletisim: {
    title: "İletişim",
    description: "Bize ulaşın.",
    render: (s) => (
      <>
        <h2>İletişim bilgileri</h2>
        {seller(s)}
        {s.whatsappNumber && <p>WhatsApp: <a className="underline" href={`https://wa.me/${s.whatsappNumber.replace(/\D/g, "")}`} rel="noopener noreferrer" target="_blank">mesaj gönder</a></p>}
        <p>Aşağıdaki formdan da bize yazabilirsiniz.</p>
      </>
    ),
  },
  sss: {
    title: "Sıkça sorulan sorular",
    description: "Sipariş, ödeme, kargo ve iade hakkında sorular.",
    render: () => (
      <>
        <h3>Siparişimi nasıl takip ederim?</h3>
        <p>Üyeyseniz <Link className="underline" href="/hesabim/siparisler">Hesabım → Siparişlerim</Link> sayfasından. Üye olmadan verdiğiniz siparişleri, sipariş sonrası gösterilen bağlantıdan takip edebilirsiniz.</p>
        <h3>Hangi ödeme yöntemleri var?</h3>
        <p>Ödeme adımında aktif yöntemler listelenir. Kredi kartı ödemesi henüz bağlanmamıştır.</p>
        <h3>Kişiye özel ürünlerde harf/isim nasıl seçilir?</h3>
        <p>Ürün sayfasındaki kişiselleştirme alanına yazdığınız metin siparişe aynen eklenir. Sepette ve sipariş özetinde kontrol edebilirsiniz.</p>
        <h3>İndirim kodunu nereye yazarım?</h3>
        <p><Link className="underline" href="/sepet">Sepet</Link> sayfasındaki “İndirim kodu” alanına.</p>
        <h3>İade ve değişim</h3>
        <p>Koşullar için <Link className="underline" href="/sayfa/iade-ve-degisim">İade ve değişim</Link> sayfasına bakın.</p>
      </>
    ),
  },
  "kargo-ve-teslimat": {
    title: "Kargo ve teslimat",
    description: "Kargo ücreti ve teslimat bilgileri.",
    render: (s) => {
      const fee = parseInt(s.shippingFee, 10) || 0;
      const free = parseInt(s.freeShippingThreshold, 10) || 0;
      return (
        <>
          <p>Kargo ücreti: <strong>{fee ? formatTRY(fee) : "ücretsiz"}</strong>{free ? <> — <strong>{formatTRY(free)}</strong> ve üzeri siparişlerde ücretsiz.</> : null}</p>
          <p>{s.shippingInfo}</p>
          <ul>
            <li>Çalışılan kargo firması: <mark className="rounded bg-warning-soft px-1">[girilmeli]</mark></li>
            <li>Siparişin kargoya veriliş süresi: <mark className="rounded bg-warning-soft px-1">[girilmeli]</mark></li>
            <li>Kişiye özel ürünlerde hazırlık süresi: <mark className="rounded bg-warning-soft px-1">[girilmeli]</mark></li>
          </ul>
          <p>Kargoya verilen siparişlerin takip numarası sipariş sayfasında görünür.</p>
        </>
      );
    },
  },
  "iade-ve-degisim": {
    title: "İade ve değişim",
    description: "İade ve değişim koşulları.",
    legal: true,
    render: (s) => (
      <>
        <p>Bu sayfa, mesafeli satışlarda tüketicinin cayma hakkına ilişkin mevzuata (6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği) uygun olarak işletme tarafından doldurulmalıdır. Süreler ve istisnalar güncel mevzuattan doğrulanmalıdır.</p>
        <h3>Doldurulması gerekenler</h3>
        <ul>
          <li>Cayma hakkı süresi ve nasıl kullanılacağı (bildirim kanalı: {v(s.companyEmail, "E-posta")})</li>
          <li>İade adresi: {v(s.companyAddress, "İade adresi")}</li>
          <li>İade kargo ücretinin kim tarafından karşılanacağı</li>
          <li>Ücret iadesinin süresi ve yöntemi</li>
          <li>Cayma hakkının istisnaları (ör. tüketicinin isteğiyle kişiye özel hazırlanan ürünler, hijyen gerekçesiyle iadesi uygun olmayan ürünler) — mevzuattan doğrulanarak</li>
          <li>Ayıplı / hatalı ürün süreci</li>
        </ul>
      </>
    ),
  },
  gizlilik: {
    title: "Gizlilik politikası",
    description: "Kişisel verilerin ve çerezlerin kullanımı.",
    legal: true,
    render: (s) => (
      <>
        <p>Bu sitenin teknik olarak işlediği veriler aşağıda listelenmiştir. Metin, veri sorumlusu {v(s.companyTitle, "İşletme unvanı")} tarafından hukuki inceleme ile tamamlanmalıdır.</p>
        <h3>Sitede tutulan veriler</h3>
        <ul>
          <li>Üyelik: ad soyad, e-posta, telefon (isteğe bağlı), şifrenin geri çevrilemez özeti (şifrenin kendisi saklanmaz).</li>
          <li>Sipariş: teslimat ve fatura bilgileri, sipariş içeriği, sipariş notu.</li>
          <li>Kayıtlı adresler, favoriler, sepet içeriği.</li>
          <li>Bülten aboneliği ve iletişim formu mesajları.</li>
          <li>Kart bilgisi bu sitede istenmez ve saklanmaz.</li>
        </ul>
        <h3>Çerezler</h3>
        <ul>
          <li><code>bts_session</code>: oturum çerezi (giriş yapan kullanıcı için, zorunlu).</li>
          <li><code>bts_cart</code>: misafir sepeti çerezi (zorunlu).</li>
          <li>Analiz veya reklam çerezi kullanılmamaktadır. Eklenirse bu bölüm ve açık rıza süreci güncellenmelidir.</li>
        </ul>
      </>
    ),
  },
  kvkk: {
    title: "KVKK aydınlatma metni",
    description: "6698 sayılı Kanun kapsamında aydınlatma metni.",
    legal: true,
    render: (s) => (
      <>
        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 10. maddesi kapsamında hazırlanacak aydınlatma metninin başlıkları aşağıdadır. İçerik hukuki inceleme ile tamamlanmalıdır.</p>
        <h3>1. Veri sorumlusu</h3>
        {seller(s)}
        <h3>2. İşlenen kişisel veriler ve işleme amaçları</h3>
        <p>[Üyelik, sipariş, teslimat, faturalandırma, müşteri iletişimi, bülten (açık rıza ile) — amaçlar ve hukuki sebepler yazılmalı]</p>
        <h3>3. Aktarılan taraflar</h3>
        <p>[Kargo firması, ödeme kuruluşu, e-posta servis sağlayıcısı, barındırma (hosting) sağlayıcısı, muhasebe — gerçek tedarikçiler yazılmalı; yurt dışı aktarım varsa belirtilmeli]</p>
        <h3>4. Toplama yöntemi ve hukuki sebep</h3>
        <p>[Site formları aracılığıyla elektronik ortamda — hukuki sebepler yazılmalı]</p>
        <h3>5. İlgili kişinin hakları</h3>
        <p>Kanun’un 11. maddesindeki haklar ve başvuru yöntemi ({v(s.companyEmail, "Başvuru e-postası")}) yazılmalıdır.</p>
      </>
    ),
  },
  "on-bilgilendirme": {
    title: "Ön bilgilendirme formu",
    description: "Mesafeli satış öncesi ön bilgilendirme formu.",
    legal: true,
    render: (s) => (
      <>
        <p>Mesafeli Sözleşmeler Yönetmeliği’nde sayılan bilgiler sipariş onayından önce tüketiciye sunulmalıdır. Bu sayfa şablondur; ideal olarak her siparişe özel (ürün, fiyat, teslimat bilgileriyle) oluşturulmalı ve hukuki inceleme yapılmalıdır.</p>
        <h3>Satıcı bilgileri</h3>
        {seller(s)}
        <h3>Doldurulacak başlıklar</h3>
        <ul>
          <li>Ürünün temel nitelikleri, vergiler dahil toplam fiyatı</li>
          <li>Teslimat masrafları ve teslim şekli / süresi</li>
          <li>Ödeme bilgileri</li>
          <li>Cayma hakkı, kullanım koşulları, süresi ve istisnaları</li>
          <li>Şikâyet ve itiraz başvuru yolları</li>
        </ul>
      </>
    ),
  },
  "mesafeli-satis": {
    title: "Mesafeli satış sözleşmesi",
    description: "Mesafeli satış sözleşmesi.",
    legal: true,
    render: (s) => (
      <>
        <p>Sözleşme metni hukukçu tarafından hazırlanmalıdır. Sipariş verilirken müşterinin onay zamanı sistemde kaydedilir (sipariş kaydındaki “agreementsAt” alanı).</p>
        <h3>Taraflar</h3>
        <p>Satıcı:</p>
        {seller(s)}
        <p>Alıcı: sipariş formunda girilen bilgiler.</p>
        <h3>Doldurulacak başlıklar</h3>
        <ul>
          <li>Sözleşmenin konusu, ürün ve fiyat bilgileri</li>
          <li>Teslimat, ifa süresi</li>
          <li>Cayma hakkı ve istisnaları</li>
          <li>Uyuşmazlıkların çözümü (Tüketici Hakem Heyeti / Tüketici Mahkemesi) — güncel parasal sınırlarla</li>
        </ul>
      </>
    ),
  },
};
