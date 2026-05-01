import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", axes: ["opsz"] });
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { AuthProvider } from "@/components/auth-provider";
import { BetaBanner } from "@/components/beta-banner";

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
    <html lang="es" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <BetaBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
