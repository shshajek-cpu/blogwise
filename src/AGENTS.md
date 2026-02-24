<!-- Generated: 2026-02-24 | Parent: ../AGENTS.md -->

# src/

## Purpose
Next.js 16 App Router 애플리케이션의 모든 소스 코드. 관리자 대시보드, 공개 블로그 페이지, RESTful API 라우트, React 컴포넌트, 핵심 비즈니스 로직 라이브러리를 포함.

## Key Files

| File | Description |
|------|-------------|
| `middleware.ts` | Next.js 요청 미들웨어 - `/admin` 경로 인증 보호, Supabase 세션 업데이트 |
| `types/database.ts` | Supabase 데이터베이스 스키마 자동생성 타입 정의 (11개 테이블) |
| `types/ai.ts` | AI 모델 설정 및 비용 계산 (OpenAI, Claude, Gemini, Moonshot) |
| `types/post.ts` | 블로그 포스트 관련 타입 정의 |
| `types/crawl.ts` | 웹 크롤링 소스/플랫폼 타입 정의 |
| `types/analytics.ts` | 분석 데이터 타입 정의 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js 16 App Router 페이지 및 API 라우트 (공개/관리자/API) |
| `app/(blog)/` | 공개 블로그 페이지 (posts, categories, search) |
| `app/admin/` | 관리자 대시보드 (컨텐츠, 크롤, AI 생성, 설정, 애널리틱스) |
| `app/api/` | RESTful API 라우트 핸들러 (posts, crawl, generate, categories, tags) |
| `components/` | 재사용 가능한 React 컴포넌트 |
| `components/admin/` | 관리자 UI 컴포넌트 |
| `components/blog/` | 블로그 표시 컴포넌트 |
| `components/layout/` | 레이아웃 컴포넌트 |
| `components/ui/` | 기본 UI 컴포넌트 (버튼, 폼, 다이얼로그 등) |
| `lib/` | 핵심 비즈니스 로직 라이브러리 |
| `lib/supabase/` | Supabase 클라이언트/서버 분리, 쿼리, 관리자 기능 |
| `lib/crawl/` | 웹 크롤링 엔진 (Naver, Tistory, YouTube, 트렌드 분석) |
| `lib/ai/` | AI 모델 통합 (Gemini 이미지 생성) |
| `lib/utils/` | 유틸리티 함수 (slug, sanitize, date, SEO) |
| `types/` | TypeScript 타입 정의 |

## For AI Agents

### Working In This Directory

- **Framework**: Next.js 16 App Router (Turbopack)
- **React**: React 19 + TypeScript strict mode
- **Styling**: Tailwind CSS 4 (`@tailwindcss/postcss`)
- **Database**: Supabase (Auth, DB, Storage)
- **Route Structure**:
  - `(blog)` - 공개 페이지 라우트 그룹 (SEO 친화)
  - `admin` - 보호된 관리자 라우트 (middleware.ts 에서 인증)
  - `api` - RESTful API 핸들러
- **Authentication**: Supabase Auth + middleware 기반 인증 체크
- **RLS (Row Level Security)**: Supabase RLS 정책으로 DB 접근 제어

### Common Patterns

- **클라이언트/서버 분리**:
  - `lib/supabase/client.ts` - 클라이언트 컴포넌트용
  - `lib/supabase/server.ts` - 서버 컴포넌트/라우트 핸들러용
  - `lib/supabase/middleware.ts` - 미들웨어용

- **API 라우트 패턴**:
  ```typescript
  // GET /api/posts
  export async function GET(request: Request) {
    const supabase = createServerClient()
    const data = await supabase.from('posts').select()
    return Response.json(data)
  }
  ```

- **서버 컴포넌트에서 DB 접근**:
  ```typescript
  // 서버 컴포넌트 (app/posts/page.tsx)
  const supabase = createServerClient()
  const posts = await supabase.from('posts').select()
  ```

- **컴포넌트 구성**:
  - Admin 컴포넌트: 폼, 테이블, 대시보드 위젯
  - Blog 컴포넌트: 포스트 카드, 카테고리 필터, 검색
  - UI 컴포넌트: Button, Input, Dialog, Tabs (Shadcn/ui 기반)

### Testing Requirements

- `npm run dev` - 로컬 dev 서버 실행 (Turbopack)
- `npm run build` - 프로덕션 빌드 (type 에러 감지)
- `npm run lint` - ESLint 검사 (TypeScript strict mode)
- Supabase 설정 필수 (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Dependencies

### Core Framework
- `next` 16.1.6 - App Router, Turbopack, SSR
- `react` 19.2.3 - UI 라이브러리
- `typescript` 5.x - 타입 안정성

### Database & Auth
- `@supabase/supabase-js` - Supabase 클라이언트 SDK
- `@supabase/ssr` - SSR 지원 헬퍼 (createServerClient, createBrowserClient)

### UI & Styling
- `tailwindcss` 4 - CSS 프레임워크
- `@tailwindcss/postcss` - Tailwind CSS 4 엔진
- `@radix-ui/*` - 접근성 있는 UI 컴포넌트 (Shadcn/ui 기반)

### Content & Rich Text
- `@tiptap/react` - 리치 텍스트 에디터
- `@tiptap/extension-*` - TipTap 확장 (headings, codeblock, image 등)
- `dompurify` - HTML 새니타이징 (XSS 방지)

### Data & Utilities
- `date-fns` - 날짜 포맷팅, 파싱
- `slugify` - URL 슬러그 생성
- `recharts` - 차트 라이브러리 (분석용)

### Web Crawling & Parsing
- `cheerio` - HTML 파싱 (crawl/crawler.ts)
- `jsdom` - DOM API (분석/테스트)

### AI Integration
- 외부 API (OpenAI, Claude, Gemini, Moonshot) - HTTP 기반 통합

<!-- MANUAL: -->
