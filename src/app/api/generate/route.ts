import { NextRequest, NextResponse } from "next/server";

const MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1";

interface GenerateRequest {
  provider: string;
  model?: string;
  topic: string;
  category: string;
  tone: string;
  wordCount: number;
  seoKeywords?: string;
  sourceContent?: string;
}

function buildSystemPrompt(category: string, tone: string, wordCount: number, seoKeywords?: string): string {
  const toneMap: Record<string, string> = {
    professional: "전문적이고 권위 있는 톤으로",
    casual: "친근하고 대화하는 듯한 톤으로",
    educational: "쉽게 설명하는 교육적인 톤으로",
    informative: "객관적이고 정보 전달 위주의 톤으로",
  };

  const toneDesc = toneMap[tone] || "전문적인 톤으로";

  return `당신은 전문 블로그 작가입니다. 다음 규칙을 따라 고품질 블로그 글을 작성하세요:

1. 카테고리: ${category}
2. 톤: ${toneDesc}
3. 목표 글자 수: 약 ${wordCount}자
4. 형식: 마크다운 형식으로 작성 (제목 h2, h3 사용, 코드블록, 리스트 활용)
5. SEO 최적화: 자연스럽게 키워드를 포함${seoKeywords ? ` (핵심 키워드: ${seoKeywords})` : ""}
6. 구조: 서론 → 본론 (2~4개 섹션) → 결론
7. 각 섹션에 소제목 포함
8. 실용적인 예시나 코드 포함
9. 한국어로 작성`;
}

async function generateWithMoonshot(
  topic: string,
  systemPrompt: string,
  model: string = "moonshot-v1-128k"
) {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error("MOONSHOT_API_KEY가 설정되지 않았습니다.");
  }

  const startTime = Date.now();

  const response = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `다음 주제로 블로그 글을 작성해주세요:\n\n${topic}` },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Moonshot API 오류 (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  const generationTime = Date.now() - startTime;

  return {
    content: data.choices[0]?.message?.content ?? "",
    input_tokens: data.usage?.prompt_tokens ?? 0,
    output_tokens: data.usage?.completion_tokens ?? 0,
    total_tokens: data.usage?.total_tokens ?? 0,
    generation_time_ms: generationTime,
    model: data.model ?? model,
  };
}

async function generateWithOpenAICompatible(
  provider: string,
  topic: string,
  systemPrompt: string,
  model: string
) {
  const providerConfig: Record<string, { baseUrl: string; keyEnv: string }> = {
    openai: { baseUrl: "https://api.openai.com/v1", keyEnv: "OPENAI_API_KEY" },
    moonshot: { baseUrl: MOONSHOT_BASE_URL, keyEnv: "MOONSHOT_API_KEY" },
  };

  const config = providerConfig[provider];
  if (!config) {
    throw new Error(`지원하지 않는 provider: ${provider}`);
  }

  const apiKey = process.env[config.keyEnv];
  if (!apiKey) {
    throw new Error(`${config.keyEnv}가 설정되지 않았습니다.`);
  }

  const startTime = Date.now();

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `다음 주제로 블로그 글을 작성해주세요:\n\n${topic}` },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`${provider} API 오류 (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  const generationTime = Date.now() - startTime;

  return {
    content: data.choices[0]?.message?.content ?? "",
    input_tokens: data.usage?.prompt_tokens ?? 0,
    output_tokens: data.usage?.completion_tokens ?? 0,
    total_tokens: data.usage?.total_tokens ?? 0,
    generation_time_ms: generationTime,
    model: data.model ?? model,
    provider,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { provider, model, topic, category, tone, wordCount, seoKeywords, sourceContent } = body;

    if (!topic && !sourceContent) {
      return NextResponse.json({ error: "주제 또는 소스 콘텐츠가 필요합니다." }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(category, tone, wordCount, seoKeywords);
    const content = sourceContent
      ? `원본 콘텐츠를 참고하여 새로운 블로그 글을 작성해주세요.\n\n원본:\n${sourceContent}\n\n주제: ${topic || "위 내용을 바탕으로 작성"}`
      : topic;

    let result;

    switch (provider) {
      case "moonshot": {
        const moonshotModel = model || "moonshot-v1-128k";
        result = await generateWithMoonshot(content, systemPrompt, moonshotModel);
        result = { ...result, provider: "moonshot" };
        break;
      }
      case "openai": {
        const openaiModel = model || "gpt-4o";
        result = await generateWithOpenAICompatible("openai", content, systemPrompt, openaiModel);
        break;
      }
      default:
        return NextResponse.json(
          { error: `${provider} provider는 아직 API 연동이 준비되지 않았습니다.` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "글 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
