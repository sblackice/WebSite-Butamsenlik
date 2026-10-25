import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Şifremi unuttum", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Şifremi unuttum" subtitle="E-posta adresinizi yazın; size şifre sıfırlama bağlantısı gönderelim.">
      <ForgotForm />
    </AuthShell>
  );
}
