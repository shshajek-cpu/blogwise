<!-- Generated: 2026-02-24 -->

# src/lib/utils

## Purpose
블로그 애플리케이션 전역 유틸리티 함수 모음. 날짜 포맷팅, URL 슬러그 생성, HTML 새니타이징, SEO 메타데이터 생성, Tailwind 클래스명 유틸리티.

## Key Files

| File | Description |
|------|-------------|
| `cn.ts` | Tailwind CSS 클래스명 결합 (clsx 래퍼) |
| `date.ts` | 날짜 포맷팅 유틸리티 (한국어 지원) |
| `sanitize.ts` | HTML 새니타이징 (DOMPurify) |
| `seo.ts` | Next.js Metadata 및 JSON-LD 생성 |
| `slug.ts` | URL 슬러그 생성 및 중복 검사 |

## For AI Agents

### Working In This Directory
- 모든 함수는 순수 함수 또는 라이브러리 래퍼
- 한국어 로케일 지원 (date-fns, slugify)
- 서버/클라이언트 분리 필요 (예: sanitize.ts는 브라우저 기반)
- 환경 변수 의존성: SEO 관련 사이트명/URL
- 타입 안전: TypeScript strict 모드

### Functions

#### `cn(...inputs: ClassValue[]): string` (cn.ts)
- Tailwind CSS 클래스명 결합 (조건부 클래스 지원)
- `clsx` 라이브러리 기반
- 사용 예: `cn('px-4', isDark && 'bg-black')`

#### Date Formatting (date.ts)
- `formatDate(date)` → "2026년 2월 24일"
- `formatRelative(date)` → "3일 전"
- `formatDateTime(date)` → "2026년 2월 24일 오후 3:30"
- `formatISO(date)` → "2026-02-24T15:30:00.000Z"

#### HTML Sanitization (sanitize.ts)
- `sanitizeHtml(dirty)` - HTML 정제 (XSS 방지)
  - 허용 태그: h1-h6, p, strong, em, a, img, 표 등
  - 허용 속성: href, src, alt, class, id 등
  - 서버 사이드: 태그 제거 폴백
- `stripHtml(html)` - 모든 HTML 태그 제거

#### SEO (seo.ts)
- `generateMetadata(options)` → Next.js Metadata 객체
  - Open Graph, Twitter Card 자동 생성
  - Canonical URL, robots 메타 포함
  - 선택: 발행/수정 시간, 커스텀 이미지
- `generateJsonLd(type, options)` → JSON-LD 스키마
  - Article: 블로그 글 스키마
  - WebSite: 사이트 검색 스키마

#### URL Slugs (slug.ts)
- `generateSlug(title)` → "hello-world"
  - 한글 자동 로마자화 (locale: 'ko')
  - 소문자, 특수문자 제거, 공백 → 하이픈
- `generateUniqueSlug(title, exists)` → "hello-world-2"
  - 기존 슬러그 체크 함수 전달
  - 충돌 시 숫자 접미사 추가

### Configuration (seo.ts)

#### 환경 변수
- `NEXT_PUBLIC_SITE_NAME` (기본: 'Blogwise')
- `NEXT_PUBLIC_SITE_URL` (기본: 'https://example.com')

#### Metadata 자동 생성
- 페이지 제목: "{title} | {SITE_NAME}"
- Canonical URL: "{SITE_URL}{url}"
- Open Graph, Twitter Card 메타
- robots: `{ index: true, follow: true }` (기본)

### Type Definitions

#### GenerateMetadataOptions
```typescript
{
  title: string
  description?: string | null
  keywords?: string[] | null
  image?: string | null
  url?: string
  type?: 'website' | 'article'
  publishedAt?: string | null
  modifiedAt?: string | null
  noIndex?: boolean
}
```

#### JSON-LD Types
- `ArticleJsonLdOptions` - 블로그 글 메타
- `WebSiteJsonLdOptions` - 사이트 메타

### Testing Requirements
- 날짜 포맷: 한국어 로케일 확인 (예: "2월" not "2")
- 슬러그: 한글 입력 → 영문 로마자화 확인
- HTML 정제: XSS 벡터 (onclick, script) 제거 확인
- Metadata: og:title, og:image 포함 확인
- JSON-LD: valid JSON, @context/"@type" 포함 확인

### Common Patterns
- **Tailwind 조건부**: `cn('base', condition && 'variant')`
- **날짜 입력**: string (ISO 8601) 또는 Date 객체
- **HTML 안전**: sanitize 후 `dangerouslySetInnerHTML` 사용
- **SEO 기본값**: noIndex=false (기본값, robots 인덱싱 허용)
- **슬러그 검증**: 존재 여부 체크 콜백 필수

## Dependencies

### External
- `clsx` - 클래스명 조건부 결합
- `date-fns` - 날짜 포맷팅 (한국어 로케일 'ko' 포함)
- `dompurify` - HTML 새니타이징 (브라우저 환경)
- `slugify` - URL 슬러그 생성 (로마자화, 한국어 지원)
- `next` - Metadata 타입 정의

<!-- MANUAL: -->
