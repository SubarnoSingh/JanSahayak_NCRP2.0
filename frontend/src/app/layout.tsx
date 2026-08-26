import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalListeners } from "@/components/layout/GlobalListeners";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: {
    default: "NCRP 2.0 — e-FIR Jan-Sahayak | Report Cyber Crime",
    template: "%s | NCRP 2.0 Jan-Sahayak",
  },
  description:
    "Report cybercrime without navigating a maze. A citizen-first redesign of India's national cybercrime reporting experience.",
  manifest: "/manifest.json",
  icons: { icon: "/emblem_logo.webp", apple: "/emblem_logo.webp" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable}`}>
      <body className="font-sans">
        <I18nProvider>
          <ToastProvider>
            <GlobalListeners />
            {children}
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
