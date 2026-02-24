export type AIProvider = 'openai' | 'claude' | 'gemini' | 'moonshot'

export interface AIModelConfig {
  id: string
  name: string
  provider: AIProvider
  max_tokens: number
  cost_per_input_token: number
  cost_per_output_token: number
  supports_system_prompt: boolean
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    max_tokens: 128000,
    cost_per_input_token: 0.000005,
    cost_per_output_token: 0.000015,
    supports_system_prompt: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    max_tokens: 128000,
    cost_per_input_token: 0.00000015,
    cost_per_output_token: 0.0000006,
    supports_system_prompt: true,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    max_tokens: 200000,
    cost_per_input_token: 0.000003,
    cost_per_output_token: 0.000015,
    supports_system_prompt: true,
  },
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'claude',
    max_tokens: 200000,
    cost_per_input_token: 0.00000025,
    cost_per_output_token: 0.00000125,
    supports_system_prompt: true,
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    max_tokens: 1000000,
    cost_per_input_token: 0.000001,
    cost_per_output_token: 0.000004,
    supports_system_prompt: true,
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    max_tokens: 1000000,
    cost_per_input_token: 0.000000075,
    cost_per_output_token: 0.0000003,
    supports_system_prompt: true,
  },
  'moonshot-v1-128k': {
    id: 'moonshot-v1-128k',
    name: 'Moonshot v1 128K',
    provider: 'moonshot',
    max_tokens: 128000,
    cost_per_input_token: 0.0000006,
    cost_per_output_token: 0.0000006,
    supports_system_prompt: true,
  },
  'moonshot-v1-32k': {
    id: 'moonshot-v1-32k',
    name: 'Moonshot v1 32K',
    provider: 'moonshot',
    max_tokens: 32000,
    cost_per_input_token: 0.0000002,
    cost_per_output_token: 0.0000002,
    supports_system_prompt: true,
  },
}

export interface GenerateContentInput {
  provider: AIProvider
  model: string
  system_prompt?: string
  user_prompt: string
  temperature?: number
  max_tokens?: number
  crawled_item_id?: string
  post_id?: string
}

export interface GenerateContentResult {
  content: string
  input_tokens: number
  output_tokens: number
  total_cost_usd: number
  generation_time_ms: number
  provider: AIProvider
  model: string
}

export interface AIProviderConfig {
  provider: AIProvider
  api_key: string
  default_model: string
  temperature?: number
  max_tokens?: number
}
