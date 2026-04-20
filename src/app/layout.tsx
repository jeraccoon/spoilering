import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spoilering",
    template: "%s | Spoilering",
  },
  description:
    "Resúmenes claros con spoilers de libros, series y películas para entender una historia sin rodeos.",
  applicationName: "Spoilering",
  authors: [{ name: "Spoilering" }],
  keywords: [
    "spoilers",
    "resúmenes",
    "libros",
    "series",
    "películas",
    "final explicado",
  ],
  openGraph: {
    title: "Spoilering",
    description:
      "Resúmenes claros con spoilers de libros, series y películas.",
    url: siteUrl,
    siteName: "Spoilering",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spoilering",
    description:
      "Resúmenes claros con spoilers de libros, series y películas.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
