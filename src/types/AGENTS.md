<!-- Generated: 2026-02-24 -->

# src/types

## Purpose
TypeScript 타입 정의 및 인터페이스. Supabase 데이터베이스 스키마, 포스트, 크롤링, AI 생성, 애널리틱스 관련 타입들을 정의합니다.

## Key Files

| File | Description |
|------|-------------|
| `database.ts` | Supabase 테이블 스키마 타입 (Post, Category, Tag, CrawlSource, PageView 등) |
| `post.ts` | 포스트 관련 타입 (PostStatus, PostWithCategory, PostFull, CreatePostInput) |
| `crawl.ts` | 웹 크롤링 관련 타입 (Platform, CrawlSourceWithStats, CrawledItemWithSource) |
| `ai.ts` | AI 모델/프롬프트 관련 타입 |
| `analytics.ts` | 페이지뷰/분석 관련 타입 |

## For AI Agents

### Working In This Directory
- 순수 TypeScript 타입 정의만 포함
- Supabase 자동 생성 타입 (`database.ts`) 수정 불가
- 비즈니스 로직 관련 타입만 추가/수정
- `database.ts` 의 Database 타입을 기본으로 상속/확장

### Common Patterns
- `Post` → `PostWithCategory` → `PostFull` 점진적 확장
- Input 타입은 `CreatePostInput`, `UpdatePostInput` 명명
- DB 행 타입과 확장 타입 분리
- Union 타입으로 Platform, PostStatus 정의

## Dependencies

### Internal
- `database.ts` - DB 스키마 기반 Row/Insert/Update 타입

### External
- TypeScript stdlib

<!-- MANUAL: -->
