import type { Metadata } from "next";
import { Listing } from "@/components/Listing";
import type { ListingParams } from "@/lib/catalog";

export const metadata: Metadata = { title: "Tüm ürünler", alternates: { canonical: "/urunler" } };

export default async function AllProducts({ searchParams }: { searchParams: Promise<ListingParams> }) {
  const sp = await searchParams;
  const title = sp.indirim === "1" ? "Kampanyalı ürünler" : sp.sirala === "yeni" ? "Yeni gelenler" : sp.sirala === "cok-satan" ? "Çok satanlar" : "Tüm ürünler";
  return <Listing title={title} crumbs={[{ label: title }]} path="/urunler" where={{}} searchParams={sp} />;
}
