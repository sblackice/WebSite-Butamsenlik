import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import type { ListingParams } from "@/lib/catalog";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ListingParams> };

async function load(slug: string) {
  return prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      parent: { include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } },
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await load((await params).slug);
  if (!cat) return { title: "Kategori bulunamadı" };
  return { title: cat.name, description: cat.description ?? `${cat.name} modelleri`, alternates: { canonical: `/kategori/${cat.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await load((await params).slug);
  if (!cat) notFound();
  const top = cat.parent ?? cat;
  const siblings = cat.parent ? cat.parent.children : cat.children;
  const ids = [cat.id, ...cat.children.map((c) => c.id)];

  return (
    <Listing
      title={cat.name}
      description={cat.description}
      crumbs={cat.parent ? [{ label: cat.parent.name, href: `/kategori/${cat.parent.slug}` }, { label: cat.name }] : [{ label: cat.name }]}
      path={`/kategori/${cat.slug}`}
      where={{ categoryId: { in: ids } }}
      searchParams={await searchParams}
      subLinks={
        siblings.length
          ? [{ label: `Tümü`, href: `/kategori/${top.slug}`, active: cat.id === top.id }, ...siblings.map((s) => ({ label: s.name, href: `/kategori/${s.slug}`, active: s.id === cat.id }))]
          : undefined
      }
    />
  );
}
