import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { FeatureFlagsScript } from "@/components/feature-flags-script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataSignalGTM",
  description:
    "Signals, account data quality, and approval workflow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <FeatureFlagsScript />
      </head>
      <body className="bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
