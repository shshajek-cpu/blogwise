<!-- Generated: 2026-02-24 -->

# src/app/(blog)

## Purpose
Next.js 라우트 그룹. 공개 블로그 페이지 렌더링 - 홈페이지, 포스트 목록, 포스트 상세, 카테고리별 필터링, 검색 페이지.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 블로그 레이아웃 (Header, Footer, main 요소) |
| `page.tsx` | 블로그 홈페이지 (최신 글, 트렌딩 토픽, 추천글) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `category/[slug]/` | 카테고리별 포스트 필터링 페이지 |
| `posts/` | 포스트 목록/상세 페이지 (posts 페이지, [slug] 상세) |
| `search/` | 검색 기능 페이지 |

## For AI Agents

### Working In This Directory
- Route group `(blog)` - URL에 `(blog)` 가 노출되지 않음
- `page.tsx` 는 SSG (Server-Side Generated) - `revalidate` 3600초
- 포스트 데이터는 Supabase 에서 조회
- 광고(AdSlot), 사이드바(BlogSidebar), 페이지뷰 추적(PageViewTracker) 포함
- 카테고리 네비게이션 표시

### Common Patterns
- `getPublishedPosts()` 로 발행된 포스트만 필터링
- `getCategories()` 로 카테고리 목록 조회
- Link 컴포넌트로 포스트/카테고리 링크
- Tailwind CSS 로 반응형 레이아웃 (sm/md/lg 브레이크포인트)
- PostCard, BlogSidebar 같은 공용 컴포넌트 재사용

## Dependencies

### Internal
- `components/blog/` - PostCard, AdSlot, CategoryNav, PageViewTracker 등
- `components/layout/` - BlogSidebar, Header, Footer
- `lib/supabase/queries` - 데이터 조회 함수

### External
- `next/link` - 라우팅
- `react` - 컴포넌트

<!-- MANUAL: -->
