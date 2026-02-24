<!-- Generated: 2026-02-24 -->

# src/lib/crawl

## Purpose
웹 크롤링, 트렌드 감지, 키워드 분석, 수익 잠재력 점수 산정을 통합한 콘텐츠 발굴 엔진. Google Trends, Naver, Daum 트렌드 수집 및 한국 블로그 최적화 키워드 분석 기능.

## Key Files

| File | Description |
|------|-------------|
| `analyzer.ts` | 키워드 수익 잠재력 분석, CPC 산정, 경쟁도 평가 |
| `crawler.ts` | 멀티 플랫폼 웹 크롤러 (Naver, Tistory, YouTube, 일반 사이트) |
| `evergreen.ts` | 계절별/생애주기별/연중 상시 키워드 데이터베이스 |
| `index.ts` | 모듈 barrel export (공개 API) |
| `pipeline.ts` | 트렌드 수집→분석→크롤링 오케스트레이션 |
| `trends.ts` | Google/Naver/Daum 트렌드 수집 엔진 |

## For AI Agents

### Working In This Directory
- 모든 함수는 비동기 작업 (네트워크 I/O 포함)
- Timeout 보호: 15초 (크롤링), 10초 (트렌드)
- 한국 키워드 최적화: CPC 맵, 카테고리 분류, 경쟁도 분석
- 동적 다국어 처리: 한글/영문 혼합 키워드 지원
- 환경 변수 선택: Naver/Kakao API 키 없으면 폴백 데이터 사용

### Key Concepts

#### Keyword Analysis (analyzer.ts)
- **CPC 범위**: 한국 니즈별 (법률 $2-8, 금융 $1.5-6, 부동산 $1-4 등)
- **경쟁도**: 키워드 길이/단어수로 추정 (긴 롱테일일수록 낮음)
- **수익 점수** (0-100): CPC × 검색량 × 경쟁도 × 의도 보너스
- **장기 꼬리 키워드**: 제목 템플릿/접두사/접미사로 자동 생성

#### Trend Detection (trends.ts)
- **Google Trends KR**: RSS 피드 (approx_traffic 파싱)
- **Naver Search**: 블로그 검색 API (상위 5개 카테고리)
- **Daum/Kakao**: Web Search API (보험, 부동산, 자격증 등)
- **Evergreen Keywords**: 계절/생애주기/연중 상시 병합
- **Quality Filter**: 저가치 키워드 제외 (날씨, 속보, 라이브)

#### Crawler (crawler.ts)
- **플랫폼별 크롤러**: Naver Blog (RSS), Tistory (RSS), YouTube (API/HTML), Generic (HTML+RSS)
- **구조화된 데이터**: title, content, images, author, publishedAt, metadata
- **콘텐츠 제한**: 50KB 문자열 상한선
- **이미지 추출**: 최대 20개, URL 정규화 포함

#### Pipeline (pipeline.ts)
- **단계**: 트렌드 수집 → 순위 산정 → 필터링 → 크롤링 → DB 저장
- **배치 처리**: 3개씩 병렬 크롤링
- **고가치 판정**: revenuePotential >= 30 (기본값)
- **DB 저장**: Supabase crawled_items 테이블

#### Evergreen Keywords (evergreen.ts)
- **계절 달력**: 1월-12월 시즌별 키워드 (총 47개)
- **연중 상시**: 금융/정부지원/부동산/보험/건강/교육 (총 30개)
- **생애주기**: 취업/결혼/출산/내집마련/은퇴/자동차 (총 31개)
- **수요도**: 0-100 점수 (일관된 검색 수요 표시)

### Functions

#### Analyzer
- `analyzeKeyword(keyword, trendScore)` - 단일 키워드 분석
- `rankTopicsByRevenue(topics)` - 다중 주제 순위 산정
- `generateLongTailVariants(keyword)` - 롱테일 변형 생성

#### Crawler
- `crawlSource(options)` - URL 크롤링 (플랫폼별 자동 선택)
- `crawlForKeyword(keyword, maxResults)` - 검색어로 상위 기사 크롤링

#### Trends
- `fetchGoogleTrends()`, `fetchNaverTrends()`, `fetchDaumTrends()`
- `getAllTrends()` - 모든 소스 병합 + 중복 제거 + 수익도 정렬

#### Evergreen
- `getSeasonalKeywords()` - 현재/다음달 시즌 키워드
- `getEvergreenKeywords()` - 연중 상시 키워드
- `getLifeEventKeywords()` - 생애주기 키워드
- `getAllEvergreenKeywords()` - 전체 병합 정렬

#### Pipeline
- `runCrawlPipeline(options)` - 전체 파이프라인 실행
- `crawlSingleSource(sourceId)` - 단일 소스 크롤링

### Environment Variables
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` - Naver Search API (선택)
- `KAKAO_API_KEY` - Kakao Web Search API (선택)
- `YOUTUBE_API_KEY` - YouTube Data API v3 (선택)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase (선택)

### Testing Requirements
- API 없을 때 폴백 데이터 반환 확인
- 네트워크 timeout (15초 이상) 처리 확인
- 중복 제거: 정규화된 키워드로 비교
- 저가치 키워드 필터링: 날씨/속보/라이브 제외
- 이미지 추출: 상대 경로/프로토콜 상대 URL 처리
- RSS/HTML 파싱: CDATA/엔티티 디코딩

### Common Patterns
- **폴백 전략**: API 실패 시 high-CPC 공식 주제 반환
- **중복 제거**: `normalizeKeyword()` (소문자+공백제거+특수문자제거)
- **에러 핸들링**: 콘솔 로깅 + empty array 반환
- **비동기**: Promise.all()로 병렬 처리
- **타입 안전**: discriminated union (TrendingTopic.source, KeywordType)

## Dependencies

### External
- `@supabase/supabase-js` - DB 저장 (pipeline)
- (fetch API 내장) - HTTP 요청

<!-- MANUAL: -->
