"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type GenerationStep = "idle" | "trends" | "benchmark" | "generate" | "done" | "error";

export const GENERATION_STEP_LABELS: Record<GenerationStep, string> = {
  idle: "",
  trends: "트렌딩 키워드 분석 중...",
  benchmark: "인기 콘텐츠 벤치마킹 중...",
  generate: "AI 글 생성 중...",
  done: "완료!",
  error: "오류 발생",
};

export interface GenerationJob {
  id: string;
  mode: "auto" | "manual" | "batch";
  step: GenerationStep;
  keyword: string;
  startedAt: number;
  // batch progress
  batchCurrent: number;
  batchTotal: number;
  // results
  results: { title: string; keyword: string; success: boolean }[];
  errors: string[];
}

interface GenerationContextValue {
  jobs: GenerationJob[];
  activeJob: GenerationJob | null;
  hasActiveJob: boolean;
  startJob: (opts: { id?: string; mode: "auto" | "manual" | "batch"; keyword?: string; batchTotal?: number }) => string;
  updateStep: (jobId: string, step: GenerationStep, keyword?: string) => void;
  updateBatchProgress: (jobId: string, current: number, keyword: string) => void;
  addResult: (jobId: string, result: { title: string; keyword: string; success: boolean }) => void;
  addError: (jobId: string, error: string) => void;
  finishJob: (jobId: string, success: boolean) => void;
  dismissJob: (jobId: string) => void;
  clearAll: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGeneration must be used within GenerationProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const jobIdCounter = useRef(0);

  // Auto-dismiss completed jobs after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prev) =>
        prev.filter((j) => {
          if (j.step === "done" || j.step === "error") {
            return Date.now() - j.startedAt < 60_000; // keep for 60s
          }
          return true;
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const startJob = useCallback(
    (opts: { id?: string; mode: "auto" | "manual" | "batch"; keyword?: string; batchTotal?: number }) => {
      const id = opts.id ?? `gen-${++jobIdCounter.current}-${Date.now()}`;
      const job: GenerationJob = {
        id,
        mode: opts.mode,
        step: "trends",
        keyword: opts.keyword ?? "",
        startedAt: Date.now(),
        batchCurrent: 0,
        batchTotal: opts.batchTotal ?? 1,
        results: [],
        errors: [],
      };
      setJobs((prev) => [...prev, job]);
      return id;
    },
    []
  );

  const updateStep = useCallback((jobId: string, step: GenerationStep, keyword?: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, step, ...(keyword !== undefined ? { keyword } : {}) } : j
      )
    );
  }, []);

  const updateBatchProgress = useCallback((jobId: string, current: number, keyword: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, batchCurrent: current, keyword } : j))
    );
  }, []);

  const addResult = useCallback(
    (jobId: string, result: { title: string; keyword: string; success: boolean }) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, results: [...j.results, result] } : j))
      );
    },
    []
  );

  const addError = useCallback((jobId: string, error: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, errors: [...j.errors, error] } : j))
    );
  }, []);

  const finishJob = useCallback((jobId: string, success: boolean) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, step: success ? "done" : "error" } : j))
    );
  }, []);

  const dismissJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const clearAll = useCallback(() => {
    setJobs([]);
  }, []);

  const activeJob = jobs.find((j) => j.step !== "done" && j.step !== "error" && j.step !== "idle") ?? null;

  return (
    <GenerationContext.Provider
      value={{
        jobs,
        activeJob,
        hasActiveJob: !!activeJob,
        startJob,
        updateStep,
        updateBatchProgress,
        addResult,
        addError,
        finishJob,
        dismissJob,
        clearAll,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}
