export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container-x grid max-w-md gap-6 py-12 md:py-16">
      <div className="grid gap-2 text-center">
        <h1 className="text-5xl">{title}</h1>
        {subtitle && <div className="text-ink-soft">{subtitle}</div>}
      </div>
      <div className="card p-5 md:p-7">{children}</div>
    </div>
  );
}
