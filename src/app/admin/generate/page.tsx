"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GeneratePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/crawl");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-sm text-gray-400">리다이렉트 중...</p>
    </div>
  );
}
