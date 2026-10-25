import Link from "next/link";
import { prisma } from "@/lib/db";
import { markMessageRead } from "../_actions/orders";
import { Flash, PageHead, type AdminSP } from "../_components";

export default async function AdminMessages({ searchParams }: { searchParams: AdminSP }) {
  const [messages, subs] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.newsletterSubscriber.count(),
  ]);
  return (
    <div className="grid max-w-4xl gap-5">
      <PageHead title="Mesajlar" />
      <Flash searchParams={searchParams} />
      <p className="text-sm">Bülten abonesi: <strong>{subs}</strong> · <Link className="underline" href="/admin/bulten">CSV indir</Link></p>
      {messages.map((m) => (
        <article key={m.id} className={`card grid gap-2 p-4 ${m.isRead ? "opacity-70" : ""}`}>
          <header className="flex flex-wrap justify-between gap-2 text-sm">
            <strong>{m.subject}</strong>
            <span className="text-ink-soft">{m.name} · {m.email} · {new Date(m.createdAt).toLocaleString("tr-TR")}</span>
          </header>
          <p className="whitespace-pre-line text-sm">{m.message}</p>
          {!m.isRead && <form action={markMessageRead}><input type="hidden" name="id" value={m.id} /><button className="text-sm underline" type="submit">Okundu işaretle</button></form>}
        </article>
      ))}
      {!messages.length && <p className="text-ink-soft">Mesaj yok.</p>}
    </div>
  );
}
