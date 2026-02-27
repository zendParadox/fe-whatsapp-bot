import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TopProgress from "@/components/ui/TopProgress";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://gotek.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GoTEK — Asisten Keuangan WhatsApp Berbasis AI",
    template: "%s | GoTEK",
  },
  description:
    "Catat keuangan langsung dari WhatsApp! GoTEK adalah bot AI yang membantu Anda mencatat pemasukan, pengeluaran, budget, dan laporan keuangan — semua lewat chat.",
  keywords: [
    "GoTEK",
    "bot keuangan WhatsApp",
    "pencatatan keuangan",
    "AI finance",
    "personal finance Indonesia",
    "budgeting app",
    "WhatsApp bot",
    "asisten keuangan",
    "catat pengeluaran",
    "kantong keuangan",
  ],
  authors: [{ name: "GoTEK Team" }],
  creator: "GoTEK",
  publisher: "GoTEK",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "GoTEK",
    title: "GoTEK — Asisten Keuangan WhatsApp Berbasis AI",
    description:
      "Catat keuangan langsung dari WhatsApp! Bot AI yang membantu Anda mencatat pemasukan, pengeluaran, budget, dan laporan keuangan — semua lewat chat.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GoTEK — Asisten Keuangan WhatsApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoTEK — Asisten Keuangan WhatsApp Berbasis AI",
    description:
      "Catat keuangan langsung dari WhatsApp! Bot AI pencatatan pemasukan, pengeluaran, budget, dan laporan keuangan.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopProgress colorClass="bg-primary" height="h-1" />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

