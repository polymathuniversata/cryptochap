import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoChap - WhatsApp USDC on Base",
  description: "Send, receive, and buy USDC on Base network through WhatsApp chat",
  keywords: "crypto, whatsapp, usdc, base, blockchain, chat, payments",
  authors: [{ name: "CryptoChap Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#25D366" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}