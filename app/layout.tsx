import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bambu Filament Inventory",
  description: "Handbook and personal filament dashboard — register for your own inventory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <footer className="mt-auto border-t border-white/[0.05] px-4 py-3 text-center text-[11px] text-zinc-600">
          As an Amazon Associate we earn from qualifying purchases.
        </footer>
      </body>
    </html>
  );
}
