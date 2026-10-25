import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { Breadcrumbs } from "@/components/Listing";
import { PAGES } from "@/content/pages";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = PAGES[(await params).slug];
  return page ? { title: page.title, description: page.description, alternates: { canonical: `/sayfa/${(await params).slug}` } } : {};
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  const settings = await getSettings();
  return (
    <div className="container-x max-w-3xl pt-5">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="mt-4 text-5xl">{page.title}</h1>
      {page.legal && (
        <p className="alert alert-warning mt-5 text-sm">
          <strong>Taslak metin.</strong> Bu sayfa yasal metin yerine geçmez; yayına almadan önce işletme bilgileriyle doldurulmalı ve hukuki incelemeden geçirilmelidir.
        </p>
      )}
      <div className="prose-legal mt-6">{page.render(settings)}</div>
      {slug === "iletisim" && <div className="mt-8"><ContactForm /></div>}
    </div>
  );
}
