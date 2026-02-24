<!-- OMC:START -->
<!-- OMC:VERSION:4.2.7 -->

# UI 컴포넌트 - 기본 디자인 시스템

**Parent:** ../AGENTS.md
**Generated:** 2026-02-24

## 개요

모든 프로젝트에서 재사용 가능한 기본 UI 컴포넌트들. 일관된 스타일, 접근성, 타입 안정성을 제공합니다.

## Key Files

| 파일 | 목적 | 주요 기능 |
|------|------|---------|
| **index.ts** | Export 통합 | 모든 UI 컴포넌트 export |
| **Button.tsx** | 버튼 컴포넌트 | 다양한 변형, 크기, 로딩 상태 |
| **Card.tsx** | 카드 컴포넌트 | Card + CardHeader + CardContent + CardFooter |
| **Input.tsx** | 입력 필드 | 라벨, 헬퍼 텍스트, 에러 메시지 |
| **Select.tsx** | 선택 필드 | 라벨, 옵션 배열, 에러 상태 |
| **Badge.tsx** | 배지 | 6가지 변형, 작은 점 옵션 |
| **Modal.tsx** | 모달 다이얼로그 | 3가지 크기, ESC 닫기, 포탈 렌더링 |
| **Toast.tsx** | 토스트 알림 | 4가지 변형, 자동 소멸, 프로그레스 바 |
| **Skeleton.tsx** | 로딩 스켈레톤 | 4가지 변형 (text, circle, rectangle, card) |
| **Pagination.tsx** | 페이지네이션 | 동적 페이지 범위, 말줄임표 |
| **DataTable.tsx** | 데이터 테이블 | 정렬, 로딩 상태, 빈 상태 |

## Component Details

### Button.tsx
- Variants: primary, secondary, outline, ghost, danger
- Sizes: sm (h-8), md (h-10), lg (h-12)
- Props: `variant`, `size`, `loading`, `iconLeft`, `iconRight`, `href` (선택)
- href가 있으면 Link 렌더링, 없으면 button 렌더링
- loading: 스피너 표시 + 포인터 이벤트 비활성화

### Card.tsx
- 서브컴포넌트: Card.Header, Card.Content, Card.Footer
- Props: `hover` (hover:shadow-md)
- 기본 스타일: bg-surface, border-border, rounded-lg

### Input.tsx
- Sizes: sm (h-8), md (h-10)
- Variants: default, error
- Props: `label`, `helperText`, `errorMessage`, `iconLeft`, `size`
- aria-invalid, aria-describedby 지원

### Select.tsx
- Props: `label`, `helperText`, `errorMessage`, `options`
- options 형식: `{ value, label, disabled? }`
- 자동 화살표 아이콘 (우측 하단)

### Badge.tsx
- Variants: default, success, warning, error, info, scheduled
- Sizes: sm, md
- Props: `variant`, `size`, `dot` (작은 원형 점 표시)
- 글꼴: font-medium, rounded-full

### Modal.tsx
- Sizes: sm (max-w-sm), md (max-w-lg), lg (max-w-2xl)
- Props: `open`, `onClose`, `title`, `description`, `size`
- 포탈 렌더링 (document.body)
- ESC 키로 자동 닫기
- 백드롭 클릭으로 닫기

### Toast.tsx
- Variants: success (초록), error (빨강), warning (노랑), info (파랑)
- Toast: 개별 알림
- ToastContainer: 여러 알림 스택
- Props: `variant`, `title`, `message`, `duration` (기본 5초)
- 프로그레스 바로 남은 시간 시각화

### Skeleton.tsx
- Variants: text (여러 줄), circle, rectangle, card
- Props: `variant`, `width`, `height`, `lines` (text용)
- aria-busy="true" 지원
- 기본: bg-gray-200, animate-pulse

### Pagination.tsx
- Props: `currentPage`, `totalPages`, `onPageChange`, `siblingCount` (기본 1)
- 동적 페이지 범위: 첫/이전/(말줄임+페이지)/다음/마지막
- 비활성 버튼: disabled opacity-40
- aria-current="page" 활성 버튼

### DataTable.tsx
- 제네릭: T extends Record<string, unknown>
- Column: `{ key, header, sortable?, className?, render? }`
- Props: `columns`, `data`, `loading`, `emptyMessage`, `rowKey`, `onRowClick`
- 정렬: asc/desc/null (3상태 토글)
- SortIcon으로 시각화
- Skeleton 로딩 상태

## For AI Agents

### 컴포넌트 수정 시 주의사항

1. **Button**
   - href 있으면: next/link Link 사용
   - 없으면: HTML button 사용
   - loading: children 대신 스피너 표시
   - 타입: ButtonAsButton | ButtonAsLink 유니언

2. **Card**
   - 복합 컴포넌트 패턴 (Card.Header, .Content, .Footer)
   - 라우팅 없음, 순수 UI

3. **Input / Select**
   - aria-invalid, aria-describedby 필수
   - id 자동 생성: label.toLowerCase().replace(/\s+/g, "-")
   - helperText와 errorMessage는 동시 표시 불가 (errorMessage 우선)

4. **Badge**
   - dot 색상: variantConfig에서 정의
   - 기본 크기: md (px-2.5 py-1 text-xs)

5. **Modal**
   - createPortal 사용 (document.body)
   - body overflow:hidden 처리
   - ESC 핸들러: useCallback + useEffect

6. **Toast / ToastContainer**
   - Toast: 개별 컴포넌트, progress 관리
   - ToastContainer: 배열 아이템들 렌더링
   - 자동 소멸: duration 경과 후 onDismiss 호출

7. **Skeleton**
   - aria-busy="true" 지원
   - text variant: 마지막 줄은 75% 너비

8. **Pagination**
   - totalPages <= 1이면 null 반환
   - 페이지 범위: siblingCount 기반 동적 계산
   - 말줄임 처리: 2개 이상 gap이면 ellipsis 삽입

9. **DataTable**
   - 정렬: useMemo로 최적화
   - rowKey: 기본 인덱스, 커스텀 가능
   - render: (value, row, index) => ReactNode 서명

## Dependencies

- Next.js (Link)
- React 18+ (createPortal, useMemo 등)
- Tailwind CSS (색상, 크기 클래스)

## Type Exports

```typescript
// Button
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"
type ButtonProps = ButtonAsButton | ButtonAsLink

// Input
type InputSize = "sm" | "md"
type InputVariant = "default" | "error"

// Badge
type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "scheduled"
type BadgeSize = "sm" | "md"

// Modal
type ModalSize = "sm" | "md" | "lg"

// Skeleton
type SkeletonVariant = "text" | "circle" | "rectangle" | "card"

// Toast
type ToastVariant = "success" | "error" | "warning" | "info"

// DataTable
type SortDirection = "asc" | "desc" | null
interface Column<T> { key, header, sortable?, className?, render? }
```

## MANUAL

<!-- OMC:END -->
