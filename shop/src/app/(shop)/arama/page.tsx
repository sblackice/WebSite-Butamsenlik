import type { Metadata } from "next";
import { Listing } from "@/components/Listing";
import type { ListingParams } from "@/lib/catalog";

export const metadata: Metadata = { title: "Arama", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<ListingParams> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  return (
    <Listing
      title={q ? `“${q.slice(0, 80)}” için sonuçlar` : "Arama"}
      description={q ? null : "Aramak istediğiniz ürünü üstteki arama kutusuna yazın."}
      crumbs={[{ label: "Arama" }]}
      path="/arama"
      where={{}}
      searchParams={sp}
    />
  );
}
