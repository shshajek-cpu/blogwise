<!-- Generated: 2026-02-24 -->

# src/lib/ai

## Purpose
Gemini API를 이용한 AI 기반 블로그 기능. 주로 블로그 게시물의 featured image 생성 기능 제공.

## Key Files

| File | Description |
|------|-------------|
| `gemini-image.ts` | Gemini 이미지 생성 및 Supabase Storage 업로드 |

## For AI Agents

### Working In This Directory
- Gemini API (`gemini-2.0-flash-exp` 모델) 직접 호출
- 이미지 생성 후 base64 데이터URL로 반환
- 선택적으로 생성된 이미지를 Supabase Storage에 저장
- 이미지 프롬프트는 블로그 주제별 최적화 (전문적, 깔끔, 미니멀 스타일)

### Functions

#### `generateFeaturedImage(keyword, title, excerpt): Promise<ImageGenerationResult>`
- Gemini 이미지 생성 API 호출
- 키워드/제목/요약으로 프롬프트 빌드
- 실패 시 null 반환 + 에러 로깅
- 성공 시 base64 data URL 반환

#### `uploadImageToSupabase(base64DataUrl, slug): Promise<string | null>`
- base64 이미지를 Supabase Storage에 업로드
- `posts/{slug}-{timestamp}.{ext}` 경로로 저장
- 실패 시 base64 data URL을 폴백으로 반환
- 성공 시 공개 URL 반환

### Environment Variables
- `GEMINI_API_KEY` - Gemini API 인증 토큰 (필수)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL (선택)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 익명 키 (선택)

### Testing Requirements
- GEMINI_API_KEY 없으면 null 반환 확인
- Supabase 미설정 시 base64 폴백 확인
- 이미지 응답 파싱 (inlineData.mimeType/data 추출)
- 20KB 이상 이미지만 업로드 시도

### Common Patterns
- API 에러는 콘솔 로깅 + null 반환
- Supabase 업로드 실패 시 base64 폴백 제공
- 이미지 프롬프트: 주제, 제목, 요약으로 구성
- 응답 형식: `{ imageUrl: string | null, error?: string }`

## Dependencies

### External
- `@supabase/supabase-js` - 스토리지 업로드

<!-- MANUAL: -->
