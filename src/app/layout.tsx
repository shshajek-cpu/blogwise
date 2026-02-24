import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Blogwise - AI가 만드는 스마트 블로그",
    template: "%s | Blogwise",
  },
  description: "AI 기반 콘텐츠 자동 생성 블로그 플랫폼",
  keywords: ["블로그", "AI", "콘텐츠", "자동 생성"],
  authors: [{ name: "Blogwise" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Blogwise",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
