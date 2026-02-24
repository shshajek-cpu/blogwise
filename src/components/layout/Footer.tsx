"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">
              Blogwise<span className="text-primary-400">.</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI가 만드는 스마트 블로그 플랫폼.<br />
              최신 기술 트렌드와 인사이트를 만나보세요.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-primary-600 text-gray-400 hover:text-white transition-colors" aria-label="RSS">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" /></svg>
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-primary-600 text-gray-400 hover:text-white transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-primary-600 text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">바로가기</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/posts" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">최신 글</Link>
              <Link href="/category/ai" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">AI</Link>
              <Link href="/category/tech" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">기술</Link>
              <Link href="/category/dev" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">개발</Link>
              <Link href="/search" className="text-sm text-gray-400 hover:text-primary-400 transition-colors">검색</Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">뉴스레터</h3>
            <p className="text-sm text-gray-400">매주 엄선된 기술 인사이트를 받아보세요.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="이메일 주소"
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                구독
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 Blogwise. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">이용약관</Link>
          </nav>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary-600 via-primary-400 to-accent" />
    </footer>
  );
}
