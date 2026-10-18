import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Sans } from "next/font/google";
import { SITE_URL } from "@/config/business";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Elevate Real Estate (ERE) — Estate Agents in Parow, Cape Town",
    template: "%s | Elevate Real Estate",
  },
  description:
    "Elevate Real Estate (ERE) is a Parow-based estate agency helping buyers and sellers across Cape Town. Browse properties, request a valuation or speak to the team.",
  applicationName: "Elevate Real Estate",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Elevate Real Estate",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#15110e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA" className={`${archivo.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
