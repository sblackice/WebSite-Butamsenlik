import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Butamsenlik | Takı ve Aksesuar", template: "%s | Butamsenlik" },
  description: "Kolye, küpe, bileklik, yüzük, halhal, saat ve kişiye özel harf / isim takılar. Bu tam senlik.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Butamsenlik" },
};

export const viewport: Viewport = { themeColor: "#f6f1ec", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
