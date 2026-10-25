import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import type { ListingParams } from "@/lib/catalog";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await prisma.collection.findUnique({ where: { slug: (await params).slug } });
  return { title: c?.name ?? "Koleksiyon" };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const c = await prisma.collection.findUnique({ where: { slug: (await params).slug } });
  if (!c) notFound();
  return (
    <Listing
      title={c.name}
      description={c.description}
      crumbs={[{ label: "Koleksiyonlar" }, { label: c.name }]}
      path={`/koleksiyon/${c.slug}`}
      where={{ collections: { some: { collectionId: c.id } } }}
      searchParams={await searchParams}
    />
  );
}
