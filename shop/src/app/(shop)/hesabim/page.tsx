import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/AuthForms";
import { ProfileForm } from "@/components/AccountForms";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountPage() {
  const u = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  return (
    <div className="grid gap-6">
      <section className="card grid gap-4 p-5"><h2 className="text-2xl">Üyelik bilgilerim</h2>
        <ProfileForm name={user.name} email={user.email} phone={user.phone ?? ""} marketing={user.marketingOk} />
      </section>
      <section className="card grid gap-4 p-5"><h2 className="text-2xl">Şifre değiştir</h2><ChangePasswordForm /></section>
    </div>
  );
}
