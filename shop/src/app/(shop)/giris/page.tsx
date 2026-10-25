import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Giriş yap" subtitle={<>Hesabınız yok mu? <Link href={`/uye-ol?next=${encodeURIComponent(next)}`} className="underline">Üye olun</Link></>}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
