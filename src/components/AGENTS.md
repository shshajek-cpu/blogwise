<!-- OMC:START -->
<!-- OMC:VERSION:4.2.7 -->

# Components 디렉토리 구조 및 에이전트 가이드

**Parent:** ../AGENTS.md
**Generated:** 2026-02-24

## 개요

블로그와이즈 UI 컴포넌트 계층. 관리자 대시보드, 블로그 페이지, 레이아웃, 기본 UI 컴포넌트를 포함합니다.

## 서브디렉토리

| 디렉토리 | 목적 | 주요 역할 |
|---------|------|---------|
| **admin/** | 관리자 대시보드 컴포넌트 | 분석 차트, 이미지 업로더, 에디터, 통계 카드, 사이드바 |
| **blog/** | 블로그 페이지 컴포넌트 | 포스트 카드, 카테고리 네비, 광고 슬롯, 검색, 공유, 목차 |
| **layout/** | 레이아웃 컴포넌트 | 헤더, 푸터, 사이드바 |
| **ui/** | 재사용 가능한 UI 컴포넌트 | 버튼, 카드, 입력, 배지, 모달, 토스트, 테이블 등 |

## For AI Agents

### 컴포넌트 추가 시 체크리스트

- [ ] 적절한 서브디렉토리에 파일 생성
- [ ] TypeScript 타입 정의 포함
- [ ] aria-label, role, aria-current 등 접근성 속성 추가
- [ ] Tailwind CSS로 스타일링 (일관성 유지)
- [ ] 필요시 상태 관리 구현 (useState, useEffect)
- [ ] 모바일 반응형 디자인 고려 (md:, lg: 브레이크포인트)
- [ ] JSDoc 주석 추가
- [ ] 해당 서브디렉토리의 AGENTS.md 업데이트

### 의존성 규칙

```
ui/           → 독립적 (다른 컴포넌트 의존 없음)
layout/       → ui/ 사용 가능
blog/         → ui/, layout/ 사용 가능
admin/        → ui/, layout/ 사용 가능
```

### 자주 사용되는 유틸리티

- `@/lib/utils/cn` - classNames 병합
- `@/components/ui/index` - 기본 UI 컴포넌트 export
- Next.js `Image`, `Link` - 최적화
- `useRouter`, `usePathname` - 네비게이션
- Recharts - 차트 시각화
- TipTap - 리치 텍스트 에디터

## Dependencies

- **recharts** - 차트 라이브러리 (AnalyticsChart 사용)
- **@tiptap/react** - 리치 텍스트 에디터 (TipTapEditor 사용)
- **next/image** - 이미지 최적화
- **next/link** - 클라이언트 네비게이션
- Tailwind CSS - 스타일링

## MANUAL

<!-- OMC:END -->
