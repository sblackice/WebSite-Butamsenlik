import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Şifre sıfırla", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <AuthShell title="Yeni şifre belirle">
      {token ? <ResetForm token={token} /> : <p>Bağlantı eksik. <Link href="/sifremi-unuttum" className="underline">Yeni bağlantı isteyin</Link>.</p>}
    </AuthShell>
  );
}
