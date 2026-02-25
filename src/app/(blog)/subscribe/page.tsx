"use client";

import { useState } from "react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-6">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">뉴스레터 구독</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          최신 글과 유용한 정보를 이메일로 받아보세요. 매주 엄선된 콘텐츠를 보내드립니다.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-10 px-6 bg-green-50 rounded-2xl border border-green-100">
          <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-green-800 mb-2">구독 신청 완료!</h2>
          <p className="text-green-600">
            <strong>{email}</strong>으로 확인 메일을 보내드렸습니다.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            이메일 주소
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            >
              구독하기
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            구독은 언제든 취소할 수 있습니다. 스팸 메일은 보내지 않습니다.
          </p>
        </form>
      )}

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-4">
          <div className="text-2xl font-bold text-primary-600 mb-1">매주</div>
          <p className="text-sm text-gray-500">엄선된 콘텐츠 발송</p>
        </div>
        <div className="p-4">
          <div className="text-2xl font-bold text-primary-600 mb-1">무료</div>
          <p className="text-sm text-gray-500">완전 무료 구독</p>
        </div>
        <div className="p-4">
          <div className="text-2xl font-bold text-primary-600 mb-1">언제든</div>
          <p className="text-sm text-gray-500">구독 취소 가능</p>
        </div>
      </div>
    </div>
  );
}
