import type { Metadata, Viewport } from "next";
import { Gowun_Dodum, Jua } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const display = Jua({
  variable: "--font-jua",
  weight: "400",
  subsets: ["latin"],
});

// 손글씨처럼 둥근 본문 글꼴 (굵기는 400 하나뿐이라 강조는 Jua + 히어로 색으로 한다)
const body = Gowun_Dodum({
  variable: "--font-gowun",
  weight: "400",
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
