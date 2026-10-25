import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center gap-4 p-8 text-center">
      <div className="grid gap-3">
        <h1 className="text-5xl">Sayfa bulunamadı</h1>
        <Link href="/" className="btn btn-primary mx-auto">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}
