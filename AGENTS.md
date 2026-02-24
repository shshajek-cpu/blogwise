<!-- Generated: 2026-02-24 | Updated: 2026-02-24 -->

# blogwise

## Purpose
Supabase 기반의 Next.js 16 블로그 플랫폼. 관리자 대시보드, 웹 크롤링/트렌드 분석, AI 콘텐츠 생성, 애널리틱스 기능을 포함하는 풀스택 블로그 CMS.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | 프로젝트 의존성 및 스크립트 (Next.js 16, React 19, Supabase, TipTap, Recharts) |
| `next.config.ts` | Next.js 설정 |
| `tsconfig.json` | TypeScript 설정 |
| `eslint.config.mjs` | ESLint 설정 |
| `postcss.config.mjs` | PostCSS/Tailwind CSS 4 설정 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | 애플리케이션 소스 코드 (see `src/AGENTS.md`) |
| `public/` | 정적 에셋 (SVG 아이콘) |
| `supabase/` | 데이터베이스 마이그레이션 및 시드 (see `supabase/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Next.js 16 App Router 사용 (Turbopack)
- React 19 + TypeScript strict mode
- Tailwind CSS 4 (`@tailwindcss/postcss`)
- Supabase 를 DB/Auth/Storage 백엔드로 사용
- `middleware.ts` 는 deprecated 경고 있음 (proxy 전환 권장)

### Testing Requirements
- `npm run dev` 로 로컬 서버 실행 후 확인
- `npm run build` 로 빌드 에러 확인
- `npm run lint` 로 린트 검사

### Common Patterns
- App Router 의 `(blog)` route group 으로 공개 페이지 분리
- `/admin` 경로로 관리자 페이지 분리
- `/api` RESTful route handlers
- Supabase client/server 분리 패턴 (`lib/supabase/`)

## Dependencies

### External
- `next` 16.1.6 - 프레임워크
- `react` 19.2.3 - UI 라이브러리
- `@supabase/supabase-js` - Supabase 클라이언트
- `@supabase/ssr` - Supabase SSR 헬퍼
- `@tiptap/react` - 리치 텍스트 에디터
- `recharts` - 차트 라이브러리
- `tailwindcss` 4 - CSS 프레임워크
- `dompurify` - HTML 새니타이징
- `date-fns` - 날짜 유틸리티
- `slugify` - URL 슬러그 생성

<!-- MANUAL: -->
