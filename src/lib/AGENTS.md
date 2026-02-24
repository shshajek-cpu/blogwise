<!-- Generated: 2026-02-24 -->

# src/lib

## Purpose
블로그 애플리케이션의 핵심 라이브러리 모음. 데이터 접근 계층(Data Access Layer), 크롤링/트렌드 분석, AI 이미지 생성, 유틸리티 함수를 포함.

## Key Files

| File | Description |
|------|-------------|
| `mock-data.ts` | 모의 블로그 게시물, 카테고리, 상세 페이지 데이터 |

## Subdirectories

| Directory | Purpose | Files |
|-----------|---------|-------|
| `ai/` | AI 기반 콘텐츠 생성 (이미지 생성, Gemini 통합) | 1 |
| `crawl/` | 웹 크롤링, 트렌드 분석, 키워드 분석 파이프라인 | 6 |
| `supabase/` | Supabase 클라이언트 및 데이터 접근 계층 | 6 |
| `utils/` | 공통 유틸리티 함수 (날짜, 슬러그, SEO, 스타일) | 5 |

## For AI Agents

### Working In This Directory
- 모든 모듈은 TypeScript strict mode 준수
- `supabase/` 는 클라이언트/서버 분리 패턴 사용
- `crawl/` 모듈은 비동기 작업 (트렌드 수집, 크롤링)
- `ai/` 모듈은 환경 변수 의존성 존재 (GEMINI_API_KEY, Supabase 설정)
- `utils/` 는 순수 함수 또는 라이브러리 래퍼

### Testing Requirements
- `crawl/` 의 API 호출은 network timeout 처리 필요
- Supabase 미설정 시 `mock-data.ts` 로 폴백 동작 확인
- 이미지 생성 기능은 GEMINI_API_KEY 환경 변수 필수

### Common Patterns
- Supabase 설정 여부 체크: `isSupabaseConfigured()` 함수 사용
- mock-data 폴백: Supabase 미설정 시 자동 사용
- 비동기 에러 처리: 네트워크 실패 시 empty array 반환
- 환경 변수 기본값: `process.env.NEXT_PUBLIC_*` 또는 .env 파일

## Dependencies

### Internal
- `mock-data.ts` ← 모든 데이터 쿼리 함수에서 폴백으로 참조

### External (per subdirectory)
- `@supabase/supabase-js` - Supabase 클라이언트 (supabase/)
- `@supabase/ssr` - SSR 헬퍼 (supabase/)
- `dompurify` - HTML 새니타이징 (utils/)
- `date-fns` - 날짜 유틸리티 (utils/)
- `slugify` - URL 슬러그 생성 (utils/)
- `clsx` - 클래스명 유틸리티 (utils/)
- `node-fetch` - HTTP 요청 (crawl/)

<!-- MANUAL: -->
