<!-- Generated: 2026-02-24 -->

# src/app/api

## Purpose
REST API 라우트 핸들러. 포스트, 카테고리, 태그, 크롤링, AI 생성, 분석, 인증 관련 엔드포인트를 제공합니다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `posts/` | 포스트 조회/생성/수정/삭제 ([id] 동적 라우트) |
| `categories/` | 카테고리 조회/생성/수정 ([id] 동적 라우트) |
| `tags/` | 태그 목록 조회 |
| `crawl/` | 웹 크롤링 (route, sources, items, trends) |
| `generate/` | AI 콘텐츠 생성 트리거 |
| `pipeline/` | 전체 파이프라인 실행 (크롤 → 생성 → 발행) |
| `analytics/` | 페이지뷰/통계 조회, 추적 (track) |
| `search/` | 포스트 검색 쿼리 |
| `sidebar/` | 사이드바 데이터 (카테고리, 태그, 최신 글) |
| `auth/` | 인증 (signout) |
| `upload/` | 이미지/파일 업로드 |
| `settings/` | 사이트 설정 조회/수정 |

## For AI Agents

### Working In This Directory
- Next.js 13+ App Router route handler 문법 사용
- `route.ts` 파일명으로 `GET`, `POST`, `PUT`, `DELETE` 메서드 정의
- Request/Response 객체는 Web Standard API
- Supabase 클라이언트 사용 (클라이언트 vs 서버 분리)
- 동적 라우트는 `[id]` 형식으로 URL 파라미터 캡처

### Common Patterns
- 모든 핸들러에서 에러 처리 및 JSON 응답
- 포스트 조회 시 `limit`, `offset`, `sort` 쿼리 파라미터 지원
- 파일 업로드는 Supabase Storage 사용
- 페이지뷰 추적은 `/api/analytics/track` 로 비동기 전송
- CORS 헤더 자동 처리 (middleware)

## Dependencies

### Internal
- `lib/supabase/` - 데이터베이스 쿼리 함수
- `lib/crawl/` - 크롤러, 분석기, 파이프라인
- `lib/ai/` - AI 생성 로직
- `types/` - 타입 정의

### External
- `next` - 프레임워크
- `@supabase/supabase-js` - DB 클라이언트

<!-- MANUAL: -->
