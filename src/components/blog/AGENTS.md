<!-- OMC:START -->
<!-- OMC:VERSION:4.2.7 -->

# Blog 컴포넌트 - 블로그 페이지

**Parent:** ../AGENTS.md
**Generated:** 2026-02-24

## 개요

블로그 페이지에서 사용되는 컴포넌트들. 포스트 표시, 카테고리 필터, 검색, 공유, 목차 등을 담당합니다.

## Key Files

| 파일 | 목적 | 주요 기능 |
|------|------|---------|
| **AdSlot.tsx** | 광고 슬롯 | AdSense 연동, 개발/프로덕션 모드 분기 |
| **CategoryNav.tsx** | 카테고리 네비게이션 | 카테고리 링크, 활성 상태 표시 |
| **PageViewTracker.tsx** | 페이지 뷰 추적 | /api/analytics/track 호출 |
| **PostCard.tsx** | 포스트 카드 | 썸네일, 제목, 발췌, 카테고리, 읽기 시간 |
| **PostsPageClient.tsx** | 포스트 목록 페이지 | 정렬, 페이지네이션, 광고 삽입 |
| **SearchBar.tsx** | 검색 입력 필드 | 폼 제출, /search?q=... 라우팅 |
| **ShareButtons.tsx** | 소셜 공유 버튼 | X(트위터), 페이스북, 링크 복사 |
| **TableOfContents.tsx** | 목차 | H2-H4 자동 추출, 스크롤 추적 |

## Component Details

### AdSlot.tsx
- Props: `position` (top-banner | in-feed | sidebar | in-article), `className`
- 개발 모드: 점선 테두리 플레이스홀더 표시
- 프로덕션: AdSense <ins> 태그 렌더링
- 크기:
  - top-banner: 728×90
  - in-feed: 600×280
  - sidebar: 300×250
  - in-article: 580×200

### CategoryNav.tsx
- Props: `categories`, `activeSlug`, `className`
- 기본 카테고리: 전체, 기술, AI, 개발, 라이프스타일, 비즈니스, 생산성
- 링크: `/posts` (전체), `/category/{slug}`

### PageViewTracker.tsx
- Props: `postSlug`, `path`
- useEffect로 /api/analytics/track POST 요청
- sessionStorage에서 bw_session 관리
- Fire-and-forget (에러 무시)

### PostCard.tsx
- 인터페이스 Post: `{ slug, title, excerpt, category, publishedAt, readTime, thumbnail? }`
- Props: `post`, `priority` (Image 최적화)
- 링크: `/posts/{slug}`
- 호버 시 썸네일 확대, 제목 색상 변경

### PostsPageClient.tsx
- Props: `initialPosts`, `categories`
- 정렬: 최신순 (기본), 인기순 (readTime 기준)
- 페이지 크기: 9개
- 광고: 6번째 카드 후 in-feed 광고 삽입
- 페이지네이션: 첫/이전/페이지번호/다음/마지막 버튼

### SearchBar.tsx
- Props: `initialQuery`, `placeholder`, `className`
- 폼 제출 시 /search?q={encoded_query}로 라우팅
- 쿼리 트림 처리

### ShareButtons.tsx
- Props: `title`, `url`, `className`
- 버튼: X(트위터), 페이스북, 링크 복사
- 링크 복사 후 2초 간 "복사됨!" 표시

### TableOfContents.tsx
- article > h2, h3, h4 자동 추출
- IntersectionObserver로 현재 섹션 추적
- smooth scroll 기능
- 헤딩 없으면 null 반환

## For AI Agents

### 컴포넌트 수정 시 주의사항

1. **AdSlot**
   - 프로덕션 AdSense: data-ad-client 설정 필요
   - isDev 체크: `process.env.NODE_ENV !== "production"`

2. **CategoryNav**
   - 스크롤 가능한 네비 (overflow-x-auto scrollbar-hide)
   - pathname 기반 활성 상태 (usePathname)

3. **PageViewTracker**
   - null 반환 컴포넌트 (렌더링 없음)
   - useEffect 의존성: postSlug, path

4. **PostCard**
   - 썸네일 없으면 그래디언트 배경
   - Image priority: 첫 카드는 true, 나머지는 false

5. **PostsPageClient**
   - 정렬/페이지 변경 시 page를 1로 리셋
   - 광고는 9개 항목 중 6번째(인덱스 5) 후 삽입

6. **SearchBar**
   - enter 키로 제출 (기본 form 동작)
   - 빈 쿼리는 제출 안 함

7. **ShareButtons**
   - window.open: "noopener,noreferrer" 보안
   - 클립보드 API 사용 (폴백 없음)

8. **TableOfContents**
   - rootMargin: "0px 0px -60% 0px" (하단 60% 기준)
   - heading 없으면 items.length === 0으로 early return

## Dependencies

- Next.js (Link, Image, usePathname, useRouter)
- recharts (없음, AdSlot은 독립적)
- Supabase (CategoryData 타입, PostsPageClient)

## MANUAL

<!-- OMC:END -->
