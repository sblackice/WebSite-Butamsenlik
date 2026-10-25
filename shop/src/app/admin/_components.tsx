import Link from "next/link";

export type AdminSP = Promise<{ ok?: string; err?: string; [k: string]: string | undefined }>;

export async function Flash({ searchParams }: { searchParams: AdminSP }) {
  const sp = await searchParams;
  if (sp.err) return <p role="alert" className="alert alert-error">{sp.err}</p>;
  if (sp.ok) return <p role="status" className="alert alert-success">{sp.ok}</p>;
  return null;
}

export function PageHead({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-4xl">{title}</h1>
      {action && <Link href={action.href} className="btn btn-primary btn-sm">{action.label}</Link>}
    </div>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="checkbox" />
      {label}
    </label>
  );
}

export function F({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export const TONE_OPTIONS = [["blush", "Pudra"], ["sage", "Adaçayı"], ["mist", "Sis"], ["sand", "Kum"]] as const;
