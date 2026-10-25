import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Admin-only CSV export. Checked here because route handlers do not run the admin layout.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "asc" } });
  const esc = (s: string) => `"${(/^[=+\-@]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`; // also blocks spreadsheet formulas
  const csv = ["email,created_at", ...rows.map((r) => `${esc(r.email)},${r.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="bulten.csv"', "Cache-Control": "no-store" },
  });
}
