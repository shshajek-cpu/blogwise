<!-- Generated: 2026-02-24 -->

# src/app/admin

## Purpose
관리자 대시보드 및 CMS. 로그인, 포스트/콘텐츠 관리, 웹 크롤링, AI 글 생성, 분석, 설정을 제공합니다.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 관리자 레이아웃 (사이드바, 상단 바, 경로표시) |
| `page.tsx` | 대시보드 메인 페이지 (통계, 차트, 최근 글, 크롤링 로그) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `login/` | 관리자 로그인 페이지 |
| `posts/` | 포스트 관리 페이지 ([id]/edit, new) |
| `contents/` | 크롤된 콘텐츠 관리 ([id]/edit) |
| `crawl/` | 웹 크롤링 소스 및 실행 관리 |
| `generate/` | AI 콘텐츠 생성 페이지 |
| `analytics/` | 분석 및 통계 페이지 |
| `settings/` | 사이트 설정 페이지 |

## For AI Agents

### Working In This Directory
- Client component 다수 - `"use client"` 지시자 사용
- Supabase 인증 필요 (middleware 에서 검증)
- TipTapEditor 로 리치 텍스트 편집
- ImageUploader 로 이미지 업로드
- Recharts 로 분석 차트 표시
- 사이드바로 네비게이션 제공

### Common Patterns
- 레이아웃의 breadcrumbMap 으로 경로표시 자동화
- `/api` 엔드포인트로 데이터 조회/수정
- 로딩 상태 및 에러 처리
- 모달/토스트로 사용자 피드백
- 통계 카드(StatsCard) 재사용

## Dependencies

### Internal
- `components/admin/` - Sidebar, StatsCard, AnalyticsChart, TipTapEditor, ImageUploader
- `components/ui/` - Button, Modal, Input, Select, DataTable
- `lib/utils/` - 유틸리티 함수

### External
- `next/link`, `next/navigation` - 라우팅
- `@tiptap/react` - 리치 텍스트 에디터
- `recharts` - 차트
- `react` - 컴포넌트

<!-- MANUAL: -->
