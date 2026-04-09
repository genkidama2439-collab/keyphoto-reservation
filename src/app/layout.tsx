import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiffProvider from "@/components/LiffProvider";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "KeyPhoto | 宮古島 星空フォトツアー予約",
  description: "宮古島の星空フォトツアー「KeyPhoto」のオンライン予約システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-noto-sans-jp)]">
        <LiffProvider />
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
