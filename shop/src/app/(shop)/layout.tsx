import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { isDemoPaymentEnabled } from "@/lib/payments";
import { getSettings, shippingRule } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <a href="#icerik" className="sr-only-focusable fixed left-2 top-2 z-[60] rounded bg-ink px-3 py-2 text-ground">
        İçeriğe geç
      </a>
      {isDemoPaymentEnabled() && (
        <div className="bg-warning-soft text-center text-xs font-semibold text-[#6a4b12]">
          <p className="container-x py-1.5">DEMO MAĞAZA: ürünler örnektir, gerçek ödeme alınmaz ve sipariş gönderilmez.</p>
        </div>
      )}
      <AnnouncementBar text={s.announcement} freeThreshold={shippingRule(s).freeThreshold} />
      <Header />
      <main id="icerik">{children}</main>
      <Footer />
    </>
  );
}
