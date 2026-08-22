import "./globals.css";
import "@/styles/css/Index.css";
import type { Metadata, Viewport } from "next";
import MainProvider from "@/e2e/MainProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_NOT_FRONTEND_URL || "https://www.temis-emr.mx";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Temis",
  description: "Expediente clínico electrónico simple y ligero",
  openGraph: {
    title: "Temis",
    description: "Expediente clínico electrónico simple y ligero",
    url: siteUrl,
    siteName: "Temis",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Temis",
    description: "Expediente clínico electrónico simple y ligero",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
};

// Temis: se quitan los "orbes" con blur(80px) animado de fondo (costosos en
// hardware modesto); queda solo el gradiente/puntos planos. Ver DECISIONS.md.
function BgCanvas() {
  return (
    <div className="lp-bg-canvas">
      <div className="lp-bg-gradient" />
      <div className="lp-bg-dots" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <BgCanvas />
        <MainProvider>{children}</MainProvider>
      </body>
    </html>
  );
}
