import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import UIProvider from "../components/UIProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoChap - WhatsApp USDC on Base",
  description: "Send, receive, and buy USDC on Base network through WhatsApp chat",
  keywords: "crypto, whatsapp, usdc, base, blockchain, chat, payments",
  authors: [{ name: "CryptoChap Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25D366" },
    { media: "(prefers-color-scheme: dark)", color: "#128C7E" }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 antialiased`}>
        <UIProvider>
          {children}
        </UIProvider>
      </body>
    </html>
  );
}