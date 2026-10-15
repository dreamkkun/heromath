import type { Metadata, Viewport } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const display = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
});

const body = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "히어로 매스 아카데미",
  description: "초등 4학년을 위한 히어로 수학 튜터",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
