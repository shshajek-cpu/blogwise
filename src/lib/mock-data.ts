import { Post } from "@/components/blog/PostCard";

export interface PostDetail extends Post {
  content: string;
  tags: string[];
  relatedSlugs: string[];
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  count: number;
}

export const mockCategories: Category[] = [
  { name: "기술", slug: "tech", description: "최신 기술 트렌드와 심층 분석", count: 48 },
  { name: "AI", slug: "ai", description: "인공지능과 머신러닝의 최전선", count: 35 },
  { name: "개발", slug: "dev", description: "개발자를 위한 실전 가이드", count: 29 },
  { name: "라이프스타일", slug: "lifestyle", description: "더 나은 삶을 위한 인사이트", count: 22 },
  { name: "비즈니스", slug: "business", description: "스타트업과 비즈니스 전략", count: 17 },
  { name: "생산성", slug: "productivity", description: "일의 효율을 극대화하는 방법", count: 14 },
];

export const mockPosts: Post[] = [
  {
    slug: "chatgpt-productivity-prompts",
    title: "ChatGPT로 생산성 10배 높이는 실전 프롬프트 모음",
    excerpt: "업무 자동화부터 글쓰기까지, 실제 현업에서 검증된 ChatGPT 프롬프트 50가지를 공개합니다. 단순 명령어가 아닌, 맥락을 이해하는 고급 기법까지 다룹니다.",
    category: { name: "AI", slug: "ai" },
    publishedAt: "2026-02-20",
    readTime: 8,
  },
  {
    slug: "ai-trends-2026",
    title: "2026년 주목해야 할 AI 트렌드 총정리",
    excerpt: "멀티모달 AI, 에이전트 시스템, 엣지 AI까지 — 올해 AI 업계를 뒤흔들 핵심 트렌드 10가지를 전문가 시각으로 분석합니다.",
    category: { name: "AI", slug: "ai" },
    publishedAt: "2026-02-18",
    readTime: 12,
  },
  {
    slug: "nextjs-16-app-router-guide",
    title: "Next.js 16 App Router 완벽 가이드",
    excerpt: "Next.js 16의 새로운 App Router를 처음부터 끝까지 파헤칩니다. Server Components, Streaming, Parallel Routes 등 핵심 개념을 실습과 함께 익혀보세요.",
    category: { name: "개발", slug: "dev" },
    publishedAt: "2026-02-15",
    readTime: 15,
  },
  {
    slug: "remote-work-routine",
    title: "원격 근무 3년 차가 알려주는 루틴 설계법",
    excerpt: "번아웃 없이 원격 근무를 지속하는 법, 직접 겪은 시행착오를 바탕으로 실천 가능한 루틴 시스템을 공유합니다.",
    category: { name: "라이프스타일", slug: "lifestyle" },
    publishedAt: "2026-02-12",
    readTime: 7,
  },
  {
    slug: "react-19-new-features",
    title: "React 19 새로운 기능 한눈에 보기",
    excerpt: "React 19에서 추가된 use() 훅, Server Actions, 개선된 Suspense까지 — 마이그레이션 가이드와 함께 정리했습니다.",
    category: { name: "개발", slug: "dev" },
    publishedAt: "2026-02-10",
    readTime: 10,
  },
  {
    slug: "typescript-advanced-patterns",
    title: "TypeScript 고급 패턴: 실무에서 바로 쓰는 타입 테크닉",
    excerpt: "조건부 타입, 템플릿 리터럴 타입, infer 키워드 활용법까지 — 타입 안전성을 극대화하는 고급 패턴을 코드 예시와 함께 설명합니다.",
    category: { name: "개발", slug: "dev" },
    publishedAt: "2026-02-08",
    readTime: 11,
  },
  {
    slug: "startup-mvp-strategy",
    title: "스타트업 MVP 전략: 3개월 만에 시장 검증하는 방법",
    excerpt: "리소스가 부족한 스타트업이 빠르게 MVP를 출시하고 실제 시장에서 검증을 받는 구체적인 전략과 사례를 소개합니다.",
    category: { name: "비즈니스", slug: "business" },
    publishedAt: "2026-02-06",
    readTime: 9,
  },
  {
    slug: "deep-focus-work-method",
    title: "딥 워크 실천법: 집중력을 극대화하는 환경 설계",
    excerpt: "칼 뉴포트의 딥 워크 개념을 현대 디지털 환경에 맞게 재해석하고, 실제로 적용 가능한 집중력 향상 시스템을 제안합니다.",
    category: { name: "생산성", slug: "productivity" },
    publishedAt: "2026-02-04",
    readTime: 8,
  },
  {
    slug: "llm-finetuning-guide",
    title: "LLM 파인튜닝 실전 가이드: LoRA부터 QLoRA까지",
    excerpt: "소규모 팀도 할 수 있는 LLM 파인튜닝 전략. LoRA, QLoRA 기법과 함께 실제 파인튜닝 파이프라인 구축 과정을 단계별로 설명합니다.",
    category: { name: "AI", slug: "ai" },
    publishedAt: "2026-02-02",
    readTime: 14,
  },
  {
    slug: "cloud-architecture-cost-optimization",
    title: "AWS 클라우드 비용 최적화: 스타트업을 위한 실전 가이드",
    excerpt: "월 클라우드 비용을 40% 절감한 실제 사례를 바탕으로, 스타트업이 즉시 적용할 수 있는 AWS 비용 최적화 전략을 공유합니다.",
    category: { name: "기술", slug: "tech" },
    publishedAt: "2026-01-30",
    readTime: 10,
  },
  {
    slug: "ux-writing-korean",
    title: "국내 서비스를 위한 UX 라이팅 가이드",
    excerpt: "사용자가 행동하게 만드는 UI 텍스트의 원칙, 국내 주요 서비스의 성공 사례와 함께 실전 적용 방법을 알아봅니다.",
    category: { name: "기술", slug: "tech" },
    publishedAt: "2026-01-28",
    readTime: 6,
  },
  {
    slug: "personal-branding-developer",
    title: "개발자 퍼스널 브랜딩: 기술 블로그로 커리어 빌드하기",
    excerpt: "기술 블로그 작성부터 오픈소스 기여, 컨퍼런스 발표까지 — 개발자로서 존재감을 높이는 브랜딩 전략을 단계별로 안내합니다.",
    category: { name: "비즈니스", slug: "business" },
    publishedAt: "2026-01-25",
    readTime: 8,
  },
];

export const mockPostDetails: Record<string, PostDetail> = {
  "chatgpt-productivity-prompts": {
    ...mockPosts[0],
    tags: ["ChatGPT", "AI", "생산성", "프롬프트"],
    relatedSlugs: ["ai-trends-2026", "llm-finetuning-guide", "deep-focus-work-method"],
    content: `
## 왜 프롬프트가 중요한가?

ChatGPT의 성능은 프롬프트 품질에 직접적으로 비례합니다. 동일한 모델도 어떻게 질문하느냐에 따라 결과물의 품질이 10배 이상 차이날 수 있습니다.

## 1. 역할 부여 프롬프트

AI에게 구체적인 역할을 부여하면 훨씬 전문적인 답변을 얻을 수 있습니다.

\`\`\`
당신은 10년 경력의 시니어 프론트엔드 개발자입니다.
다음 코드를 리뷰하고 개선 사항을 알려주세요:
[코드 삽입]
\`\`\`

## 2. 단계별 사고 유도 (Chain of Thought)

복잡한 문제는 단계별로 생각하도록 유도하세요.

\`\`\`
다음 문제를 단계별로 분석해주세요:
1. 문제 정의
2. 원인 파악
3. 해결 방안 3가지
4. 최선의 방안 추천 및 이유
\`\`\`

## 3. 출력 형식 지정

원하는 형식을 명확히 지정하면 가공 없이 바로 사용할 수 있습니다.

## 마무리

좋은 프롬프트는 하루아침에 만들어지지 않습니다. 지속적인 실험과 개선을 통해 자신만의 프롬프트 라이브러리를 구축해보세요.
    `.trim(),
  },
};

export function getPostsByCategory(slug: string): Post[] {
  return mockPosts.filter((p) => p.category.slug === slug);
}

export function searchPosts(query: string): Post[] {
  const q = query.toLowerCase();
  return mockPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.category.name.toLowerCase().includes(q)
  );
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((c) => c.slug === slug);
}
