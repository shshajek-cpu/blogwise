<!-- OMC:START -->
<!-- OMC:VERSION:4.2.7 -->

# Admin 컴포넌트 - 관리자 대시보드

**Parent:** ../AGENTS.md
**Generated:** 2026-02-24

## 개요

관리자 대시보드에서 사용되는 컴포넌트들. 분석 데이터 시각화, 콘텐츠 관리, 이미지 업로드 등을 담당합니다.

## Key Files

| 파일 | 목적 | 주요 기능 |
|------|------|---------|
| **AnalyticsChart.tsx** | 분석 차트 시각화 | WeeklyBarChart, TrafficLineChart, AIPieChart (Recharts 기반) |
| **ImageUploader.tsx** | 이미지 업로드 컴포넌트 | 드래그 드롭, 파일 검증, /api/upload 호출 |
| **Sidebar.tsx** | 관리자 사이드바 | 네비게이션 메뉴, 로그아웃, HamburgerButton |
| **StatsCard.tsx** | 통계 카드 | 라벨, 값, 트렌드(증감), 아이콘 표시 |
| **TipTapEditor.tsx** | 리치 텍스트 에디터 | TipTap 기반, 제목/리스트/코드블록 등 지원 |

## Component Details

### AnalyticsChart.tsx
- **WeeklyBarChart**: 주간 데이터 막대 그래프
- **TrafficLineChart**: 트래픽 추이 라인 차트
- **AIPieChart**: 카테고리별 분포 파이 차트
- 데이터 형식: `{ day, views, visitors?, name?, value?, color? }`

### ImageUploader.tsx
- Props: `value` (현재 이미지 URL), `onChange` (콜백)
- 지원 형식: JPG, PNG, GIF, WEBP, SVG
- 최대 크기: 5MB
- 상태: 업로드 대기, 업로드 중, 미리보기

### Sidebar.tsx
- Props: `isOpen` (사이드바 표시 여부), `onClose` (닫기 콜백)
- 네비게이션 항목: 대시보드, 크롤링, AI 글 생성, 콘텐츠 관리, 분석, 설정
- 모바일 오버레이 포함 (lg:hidden 이상에서 고정)
- 로그아웃: Supabase 연동

### StatsCard.tsx
- Props: `label`, `value`, `trend`, `icon`, `accentColor`
- 트렌드 표시: 양수(↑ 초록), 음수(↓ 빨강)
- 아이콘 배경색: accentColor로 커스터마이징

### TipTapEditor.tsx
- Props: `content`, `onChange`, `placeholder`, `className`
- 기능:
  - 제목 (H1, H2, H3)
  - 인라인 서식 (굵게, 기울임, 취소선, 코드)
  - 리스트 (순서 없음, 순서 있음)
  - 블록 (인용, 코드블록, 구분선)
  - 히스토리 (실행취소, 재실행)
- 최소 높이: 400px

## For AI Agents

### 컴포넌트 수정 시 주의사항

1. **AnalyticsChart**
   - Recharts 차트는 ResponsiveContainer로 감싸야 함
   - 라벨과 포맷터는 한글 지원
   - 색상: primary-600 (파랑), primary-400 (연한 파랑)

2. **ImageUploader**
   - FileList에서 첫 번째 파일만 처리
   - 업로드 후 input value 초기화 필요
   - 에러 메시지 3초 표시

3. **Sidebar**
   - 모바일: -translate-x-full → translate-x-0 전환
   - 데스크톱: lg:translate-x-0 고정
   - 로그아웃 시 /admin/login으로 리다이렉트

4. **StatsCard**
   - trend.value: 양수면 상승, 음수면 하강
   - accentColor: Tailwind 색상 클래스 (e.g., "bg-primary-500")

5. **TipTapEditor**
   - EditorContent는 editor 상태에 의존
   - CSS는 .ProseMirror 클래스로 스타일링
   - onChange는 editor.getHTML() 반환

## Dependencies

- **recharts** (AnalyticsChart)
- **@tiptap/react**, **@tiptap/starter-kit** (TipTapEditor)
- **@supabase/supabase-js** (Sidebar 로그아웃)
- Tailwind CSS
- Next.js (Link, usePathname)

## MANUAL

<!-- OMC:END -->
