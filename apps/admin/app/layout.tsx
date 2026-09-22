import type { Metadata } from "next";
import { Noto_Sans_Gujarati, Noto_Serif_Gujarati, Rasa } from "next/font/google";
import "./globals.css";

const notoSansGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans"
});

const notoSerifGujarati = Noto_Serif_Gujarati({
  subsets: ["gujarati", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-serif"
});

const rasaFont = Rasa({
  subsets: ["gujarati", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rasa"
});

export const metadata: Metadata = {
  title: "MAST Admin",
  description: "MAST role-scoped admin dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${notoSansGujarati.variable} ${notoSerifGujarati.variable} ${rasaFont.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
