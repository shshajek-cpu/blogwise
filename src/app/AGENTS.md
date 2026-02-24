<!-- Generated: 2026-02-24 -->

# src/app

## Purpose
Next.js App Router 진입점. 공개 블로그 페이지 `(blog)`, 관리자 대시보드 `/admin`, REST API 라우트 `/api` 를 포함합니다.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 루트 레이아웃 (메타데이터, HTML 헤더, Pretendard 폰트) |
| `globals.css` | 전역 스타일 및 Tailwind CSS 설정 |
| `favicon.ico` | 파비콘 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `(blog)/` | Next.js 라우트 그룹 - 공개 블로그 페이지 (see `(blog)/AGENTS.md`) |
| `admin/` | 관리자 대시보드 및 CMS (see `admin/AGENTS.md`) |
| `api/` | REST API 라우트 핸들러 (see `api/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Next.js 16 App Router (Turbopack)
- `(blog)` 는 route group - URL에 포함되지 않음
- `/admin` 및 `/api` 는 일반 경로
- `layout.tsx` 에서 메타데이터 및 전역 스타일 설정
- 각 서브디렉토리는 독립적인 구조 유지

### Common Patterns
- Route group `(blog)` 으로 공개 페이지 레이아웃 분리
- 각 라우트에 `layout.tsx` 존재
- App Router 의 `page.tsx` 가 실제 페이지 컴포넌트
- 동적 라우트는 `[slug]` 형식

## Dependencies

### Internal
- `components/` - UI 컴포넌트
- `lib/` - 유틸리티 및 서비스 로직
- `types/` - 타입 정의

### External
- `next` - 프레임워크
- `react` 19 - UI 라이브러리

<!-- MANUAL: -->
