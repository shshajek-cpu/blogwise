<!-- Generated: 2026-02-24 | Parent: ../AGENTS.md -->

# supabase/

## Purpose
Supabase PostgreSQL 데이터베이스 스키마 정의, 마이그레이션, 초기 데이터 설정. 11개 테이블, RLS 정책, 인덱스를 포함한 완전한 데이터베이스 구조.

## Key Files

| File | Description |
|------|-------------|
| `full-migration.sql` | 전체 DB 마이그레이션 스크립트 (모든 테이블/정책/인덱스 한번에) |
| `fix-rls.sql` | RLS (Row Level Security) 정책 설정 및 수정 |
| `seed.sql` | 초기 데이터 샘플 (카테고리, 태그, 포스트, 설정) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `migrations/` | 증분 마이그레이션 파일 (001~004) |
| `migrations/001_initial_schema.sql` | 기본 테이블 (profiles, categories, posts, tags, post_tags) |
| `migrations/002_crawl_tables.sql` | 웹 크롤링 테이블 (crawl_sources, crawled_items) |
| `migrations/003_ai_tables.sql` | AI 생성 로그 및 설정 (ai_generation_logs, site_settings) |
| `migrations/004_analytics_tables.sql` | 분석 테이블 (page_views) |

## Database Schema

### Core Tables (001)

**profiles**
- 사용자 프로필 (Supabase Auth과 연동)
- 필드: id, email, display_name, role (admin/editor/viewer), avatar_url
- RLS: 본인 프로필만 수정 가능

**categories**
- 블로그 카테고리
- 필드: id, name, slug, description, color, post_count
- 인덱스: slug

**posts**
- 블로그 포스트 (핵심 테이블)
- 필드: title, slug, content, html_content, featured_image, category_id, status (draft/published/scheduled/archived), seo_*, ai_provider, ai_model, source_url, view_count, published_at
- RLS: 공개 포스트는 모두 읽음, 편집/쓰기는 권한 확인

**tags**
- 포스트 태그 (카테고리보다 세분화)
- 필드: id, name, slug, post_count
- 인덱스: slug

**post_tags**
- posts와 tags의 다대다 관계

### Crawl Tables (002)

**crawl_sources**
- 크롤 대상 소스 (Naver Blog, Tistory, YouTube 등)
- 필드: id, name, platform, url, crawl_frequency, is_active, last_crawled_at, total_items

**crawled_items**
- 크롤된 컨텐츠 (재처리 대기 상태)
- 필드: id, source_id, original_url, title, original_content, original_html, images[], metadata, is_used, generated_post_id, crawled_at

### AI Tables (003)

**ai_generation_logs**
- AI 모델 호출 로그 (비용, 토큰 추적)
- 필드: id, post_id, crawled_item_id, provider, model, prompt_template, prompt_variables, input_tokens, output_tokens, total_cost_usd, generation_time_ms, status, error_message

**site_settings**
- 사이트 전역 설정 (JSON 스토어)
- 필드: key, value (JSON), description

### Analytics Tables (004)

**page_views**
- 포스트 조회수 및 트래픽 데이터
- 필드: id, post_id, path, referrer, user_agent, country, device_type, session_id, viewed_at
- 인덱스: post_id, viewed_at

## For AI Agents

### Working In This Directory

- **Database Engine**: PostgreSQL 14+ (Supabase 관리형)
- **RLS**: Row Level Security 활성화 (보안 정책 in fix-rls.sql)
- **SQL Dialect**: PostgreSQL (UUID, JSONB, array types)
- **Extensions**: uuid-ossp (UUID 생성)

### Common Patterns

- **마이그레이션 실행 순서**:
  ```sql
  1. 001_initial_schema.sql (기본 구조)
  2. 002_crawl_tables.sql (크롤링)
  3. 003_ai_tables.sql (AI 로깅)
  4. 004_analytics_tables.sql (분석)
  ```

- **또는 전체 한번에**:
  ```sql
  full-migration.sql (프로덕션용)
  ```

- **초기 데이터 로드**:
  ```sql
  seed.sql (샘플 데이터)
  ```

- **RLS 정책 적용**:
  ```sql
  fix-rls.sql (보안 정책 재설정)
  ```

- **인덱스**: slug 필드에 인덱스로 조회 성능 최적화

### Testing Requirements

- Supabase 프로젝트 생성 (https://supabase.com)
- SQL Editor에서 마이그레이션 스크립트 실행
- `npm run db:push` (또는 Supabase CLI 사용)
- TypeScript 타입 재생성: `npx supabase gen types postgresql > src/types/database.ts`

### RLS & Security

- **profiles**: USING/WITH CHECK `auth.uid() = id`
- **posts**: 공개 레코드는 SELECT 허용, 작성자만 UPDATE/DELETE
- **crawl_sources**: 관리자만 접근
- **ai_generation_logs**: 읽기만 허용 (감시용)
- **page_views**: 삽입만 허용 (클라이언트 분석 기록용)

## Dependencies

### Database System
- Supabase PostgreSQL 14+ (관리형)

### Migration Tools
- `supabase` CLI - 로컬 DB 관리, 타입 생성
- `postgres` - PostgreSQL 드라이버 (Node.js)

### SQL Features Used
- UUID primary keys
- JSONB columns (metadata, settings)
- Array types (images[], seo_keywords[])
- TIMESTAMPTZ (timezone-aware timestamps)
- CHECK constraints (role, status enums)
- Foreign keys with ON DELETE CASCADE/SET NULL
- Row Level Security (RLS) policies

<!-- MANUAL: -->
