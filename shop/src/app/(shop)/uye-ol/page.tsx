import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Üye ol", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Üye ol" subtitle={<>Zaten üye misiniz? <Link href={`/giris?next=${encodeURIComponent(next)}`} className="underline">Giriş yapın</Link></>}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}
