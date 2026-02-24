"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Mock mode fallback
        await new Promise((r) => setTimeout(r, 800));
        const mockEmail = email.includes("@") ? email : `${email}@blogwise.kr`;
        if (mockEmail === "shshaj@blogwise.kr" && password === "1234") {
          window.location.href = "/admin";
          return;
        }
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      const supabase = createClient();
      // Auto-append @blogwise.kr if no @ present
      const loginEmail = email.includes("@") ? email : `${email}@blogwise.kr`;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full" />
          <div className="absolute bottom-32 right-16 w-48 h-48 bg-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white rounded-full" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="text-5xl font-black text-white tracking-tight mb-4">
            Blogwise<span className="text-primary-200">.</span>
          </div>
          <p className="text-lg text-primary-100 leading-relaxed max-w-md">
            AI 기반 콘텐츠 자동 생성 플랫폼으로<br />
            블로그 운영을 스마트하게 관리하세요.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-primary-200 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              AI 글 생성
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              크롤링
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              분석
            </div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Blogwise<span className="text-primary-500">.</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">관리자 로그인</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  아이디
                </label>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shshaj"
                  className={cn(
                    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white",
                    "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                    "placeholder:text-gray-400 transition-all"
                  )}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className={cn(
                    "w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white",
                    "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                    "placeholder:text-gray-400 transition-all"
                  )}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-light text-error text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-2.5 text-sm font-semibold text-white rounded-lg",
                  "bg-gradient-to-r from-primary-600 to-primary-500",
                  "hover:from-primary-700 hover:to-primary-600",
                  "shadow-sm hover:shadow-md transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-lg bg-primary-50 border border-primary-100">
            <p className="text-xs text-primary-700 text-center font-medium">
              아이디: shshaj / 비밀번호: 1234
            </p>
            <p className="text-xs text-primary-500 text-center mt-0.5">
              (Supabase 미설정 시에만 사용 가능)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
