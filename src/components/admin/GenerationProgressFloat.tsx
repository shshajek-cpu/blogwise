"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGeneration, GENERATION_STEP_LABELS } from "@/contexts/GenerationContext";
import type { GenerationJob, GenerationStep } from "@/contexts/GenerationContext";

function StepIcon({ step }: { step: GenerationStep }) {
  if (step === "done") {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (step === "error") {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  // Spinning loader for active states
  return (
    <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ModeLabel({ mode }: { mode: string }) {
  const labels: Record<string, string> = {
    auto: "자동 생성",
    manual: "수동 생성",
    batch: "일괄 생성",
  };
  return <span className="text-xs font-medium text-gray-400">{labels[mode] ?? mode}</span>;
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const [, forceUpdate] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="text-xs text-gray-400 tabular-nums">
      {mins > 0 ? `${mins}분 ` : ""}{secs}초
    </span>
  );
}

function JobItem({ job, onDismiss }: { job: GenerationJob; onDismiss: () => void }) {
  const isActive = job.step !== "done" && job.step !== "error";
  const isBatch = job.mode === "batch" || job.batchTotal > 1;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
      isActive ? "bg-primary-50/50" : job.step === "done" ? "bg-green-50/50" : "bg-red-50/50"
    }`}>
      <div className="pt-0.5">
        <StepIcon step={job.step} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ModeLabel mode={job.mode} />
          <ElapsedTime startedAt={job.startedAt} />
        </div>
        <p className="text-sm font-medium text-gray-800 truncate mt-0.5">
          {GENERATION_STEP_LABELS[job.step] || job.keyword}
        </p>
        {job.keyword && isActive && (
          <p className="text-xs text-gray-500 truncate">
            키워드: {job.keyword}
          </p>
        )}
        {isBatch && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{job.batchCurrent}/{job.batchTotal}</span>
              <span>{job.batchTotal > 0 ? Math.round((job.batchCurrent / job.batchTotal) * 100) : 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${job.batchTotal > 0 ? (job.batchCurrent / job.batchTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
        {job.step === "done" && job.results.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            {job.results.filter((r) => r.success).length}개 글 생성 완료
          </p>
        )}
        {job.step === "error" && job.errors.length > 0 && (
          <p className="text-xs text-red-600 mt-1 truncate" title={job.errors[job.errors.length - 1]}>
            {job.errors[job.errors.length - 1]}
          </p>
        )}
      </div>
      {!isActive && (
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function GenerationProgressFloat() {
  const { jobs, hasActiveJob, dismissJob } = useGeneration();
  const [expanded, setExpanded] = useState(true);

  // Show nothing if no jobs
  const visibleJobs = jobs.filter((j) => j.step !== "idle");
  if (visibleJobs.length === 0) return null;

  const activeCount = visibleJobs.filter((j) => j.step !== "done" && j.step !== "error").length;
  const doneCount = visibleJobs.filter((j) => j.step === "done").length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[calc(100vh-6rem)] flex flex-col">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-t-xl shadow-lg hover:bg-gray-50 transition-colors"
      >
        {hasActiveJob ? (
          <div className="relative">
            <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-800">
            {hasActiveJob
              ? `글 생성 중 (${activeCount}건)`
              : `생성 완료 (${doneCount}건)`}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl shadow-lg overflow-y-auto max-h-80">
          <div className="p-2 space-y-2">
            {visibleJobs.map((job) => (
              <JobItem key={job.id} job={job} onDismiss={() => dismissJob(job.id)} />
            ))}
          </div>
          {!hasActiveJob && visibleJobs.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 flex justify-between items-center">
              <Link
                href="/admin/crawl"
                className="text-xs text-primary-600 hover:underline font-medium"
              >
                콘텐츠 생성으로 이동
              </Link>
              <button
                onClick={() => visibleJobs.forEach((j) => dismissJob(j.id))}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                모두 닫기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
