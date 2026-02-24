<!-- OMC:START -->
<!-- OMC:VERSION:4.2.7 -->

# Layout 컴포넌트 - 페이지 레이아웃

**Parent:** ../AGENTS.md
**Generated:** 2026-02-24

## 개요

모든 페이지의 기본 레이아웃을 구성하는 컴포넌트들. 헤더, 푸터, 블로그 사이드바를 포함합니다.

## Key Files

| 파일 | 목적 | 주요 기능 |
|------|------|---------|
| **Header.tsx** | 페이지 헤더 | 로고, 네비게이션, 카테고리 드롭다운, 모바일 드로어 |
| **Footer.tsx** | 페이지 푸터 | 브랜드, 빠른 링크, 뉴스레터 구독, 소셜 링크 |
| **BlogSidebar.tsx** | 블로그 사이드바 | 인기글, 카테고리, 태그, 뉴스레터 CTA |

## Component Details

### Header.tsx
- 상단 그래디언트 바
- 로고: Blogwise (primary-600)
- 데스크톱 네비 (md 이상)
  - 홈, 최신글, 카테고리 드롭다운, 검색, 구독하기
  - CategoryDropdown: 기술, AI, 라이프스타일, 개발, 비즈니스
- 모바일 네비 (md 미만)
  - 검색 아이콘, 햄버거 메뉴
  - 드로어: 메뉴 + 카테고리 + 구독
- sticky top-0 z-40

### Footer.tsx
- 어두운 배경 (bg-gray-900)
- 3단 그리드 (md 이상)
  1. 브랜드 + 소셜 링크 (RSS, X, GitHub)
  2. 빠른 링크 (최신글, 카테고리, 검색)
  3. 뉴스레터 구독 폼
- 하단 바: 저작권, 약관 링크
- 하단 그래디언트 바
- 연도: 2026

### BlogSidebar.tsx
- 비동기 데이터 로드 (/api/sidebar)
- 섹션:
  1. 인기글 (Top 3, 순위 표시)
  2. AdSlot (sidebar 300×250)
  3. 뉴스레터 CTA (그래디언트 배경)
  4. 카테고리 (count 포함)
  5. 태그 (검색 링크)
- 각 섹션 제목 좌측에 primary-600 스트라이프

## For AI Agents

### 컴포넌트 수정 시 주의사항

1. **Header**
   - 모바일 드로어: position fixed, z-50, 애니메이션 (translate-x)
   - 오버레이: z-50, bg-black/40, backdrop-blur-sm
   - 카테고리 드롭다운: 외부 클릭 감지 (useRef + useEffect)
   - 모바일 상태 변경: setMobileOpen(false) 필요

2. **Footer**
   - 소셜 링크: hover:bg-primary-600 (아이콘 버튼)
   - 뉴스레터 폼: 실제 제출 처리 없음 (e.preventDefault)
   - 세로 정렬: md 미만에서는 한 줄씩

3. **BlogSidebar**
   - 데이터 로드: fetch + useState + useEffect
   - 데이터 없으면 기본값 [] 사용
   - 인기글 번호색: 1위는 primary-600, 나머지는 gray-300
   - 태그 링크: /search?q={encoded_tag}
   - 뉴스레터 CTA: 그래디언트 (primary-600 → primary-800) + 장식 원형 요소

## Dependencies

- Next.js (Link, usePathname, useRouter)
- React Hooks (useState, useEffect, useRef)
- AdSlot (BlogSidebar 사용)
- CategoryData 타입 (BlogSidebar)

## MANUAL

<!-- OMC:END -->
