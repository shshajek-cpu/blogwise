<!-- Generated: 2026-02-24 -->

# src/lib/supabase

## Purpose
Supabase를 이용한 데이터 접근 계층(DAL). 클라이언트/서버 분리 패턴으로 Auth, 데이터베이스 쿼리, 미들웨어를 관리. Supabase 미설정 시 mock-data 폴백 자동 동작.

## Key Files

| File | Description |
|------|-------------|
| `admin.ts` | 관리자 클라이언트 (RLS 우회, 서비스 역할 키 사용) |
| `client.ts` | 브라우저 클라이언트 (익명 키 사용) |
| `middleware.ts` | Next.js 미들웨어 (세션 갱신) |
| `queries.ts` | 공개/관리자/추적 데이터 쿼리 함수 |
| `server.ts` | 서버 사이드 클라이언트 (SSR, 쿠키 기반 인증) |
| `storage-setup.sql` | Storage 버킷 설정 SQL 스크립트 |

## For AI Agents

### Working In This Directory
- **클라이언트 분리**: client(브라우저) vs server(SSR) vs admin(서비스 역할)
- **RLS 정책**: 공개 읽기, 인증 수정/삭제, 관리자 우회
- **폴백 메커니즘**: Supabase 미설정 시 mock-data.ts 사용
- **쿠키 기반 인증**: SSR 환경에서 세션 유지
- **타입 안전**: Database 타입 생성 (supabase/gen/)

### Clients

#### `createClient()` (server.ts)
- SSR 환경용 서버 사이드 클라이언트
- 쿠키 기반 세션 관리
- 미들웨어에서 세션 갱신

#### `createPublicClient()` (server.ts)
- 읽기 전용 공개 클라이언트
- ISR/SSG 환경에서 신뢰할 수 있음 (쿠키 불필요)
- 캐싱 친화적

#### `createAdminClient()` (admin.ts / server.ts)
- 관리자 클라이언트 (서비스 역할 키)
- RLS 정책 우회
- **서버 전용** - API 라우트에서만 사용

#### `createClient()` (client.ts)
- 브라우저 클라이언트 (SSR 래퍼)
- 실시간 구독 지원

### Queries (queries.ts)

#### 공개 쿼리
- `getPublishedPosts(options)` - 발행된 게시물 (카테고리/정렬/페이징)
- `getPostBySlug(slug)` - 단일 게시물 상세 조회
- `getRelatedPosts(slug, categorySlug)` - 관련 글 추천
- `getCategories()` - 카테고리 목록 + 게시물 수
- `getTags()` - 상위 20개 태그
- `getPopularPosts(limit)` - 조회수 기준 상위 글
- `searchPublishedPosts(query)` - 제목/요약 검색

#### 추적 쿼리
- `trackPageView(slug, path, headers)` - 페이지 조회 기록

#### 관리자 쿼리
- `getAdminPosts(options)` - 모든 게시물 (필터/검색)
- `getDashboardStats()` - 대시보드 통계 (오늘 조회/발행된 수/펴기 대기)
- `getSettings()` - 사이트 설정 조회
- `updateSettings(settings)` - 설정 업데이트

### Middleware (middleware.ts)

#### `updateSession(request: NextRequest)`
- Next.js 요청마다 세션 갱신
- 리프레시 토큰 처리
- 쿠키 설정
- 현재 사용자 조회

### Storage Setup (storage-setup.sql)

#### 버킷 생성
- `images` 버킷 (공개 읽기)
- 경로: `posts/{slug}-{timestamp}.{ext}`

#### RLS 정책
1. 인증 사용자: 이미지 업로드 (INSERT)
2. 공개: 이미지 읽기 (SELECT)
3. 인증 사용자: 이미지 삭제 (DELETE)

#### 선택 기능
- 사용자별 폴더 제한 (주석처리)

### Data Structures

#### PostDetailData
```typescript
{
  slug, title, excerpt, content,
  category: { name, slug },
  publishedAt, readTime, thumbnail?,
  tags[], viewCount
}
```

#### CategoryData
```typescript
{
  name, slug, description, count
}
```

### Supabase Configuration Check
```typescript
isSupabaseConfigured(): boolean
// ⇒ NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 익명 키 (공개)
- `SUPABASE_SERVICE_ROLE_KEY` - 서비스 역할 키 (비공개, 관리자 용)

### Testing Requirements
- Supabase 미설정 시 mock-data 폴백 동작 확인
- 쿠키 설정/조회 로직 검증
- RLS 정책 적용 확인 (관리자 쿼리는 서비스 역할 필수)
- 페이지 조회 추적 및 view_count 증분 확인
- 에러 처리: 쿼리 실패 시 명백한 결과 반환

### Common Patterns
- **조건부 폴백**: `if (!isSupabaseConfigured()) { return mockData }`
- **명시적 선택**: publicSupabase vs server vs admin 클라이언트
- **타입 변환**: `toPostCard()` 함수로 DB 행 → UI 타입 변환
- **에러 로깅**: 콘솔 에러 + empty/null 반환
- **동시 쿼리**: Promise.all()로 병렬 처리
- **페이징**: `offset`, `limit` 파라미터 사용

## Dependencies

### External
- `@supabase/supabase-js` - Supabase 클라이언트 라이브러리
- `@supabase/ssr` - SSR 헬퍼 패키지
- `next/cookies` - Next.js 쿠키 API
- `next/server` - 미들웨어 타입

<!-- MANUAL: -->
