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

// 링크 미리보기 이미지는 전체 주소여야 한다. Vercel 배포에선 운영 도메인, 로컬에선 localhost
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "히어로 매스",
  description: "초등 4학년을 위한 히어로 수학 튜터",
  // 카카오톡 등 링크 미리보기는 og:title을 먼저 본다. 어느 화면을 공유해도 같은 이름이 나오게 한다
  openGraph: { title: "히어로 매스", siteName: "히어로 매스" },
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
