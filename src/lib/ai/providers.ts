import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export function getAIProvider(provider: string, apiKey: string) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey })
    case 'deepseek':
      return createOpenAICompatible({
        name: 'deepseek',
        baseURL: 'https://api.deepseek.com/v1',
        apiKey,
      })
    case 'qwen':
      return createOpenAICompatible({
        name: 'qwen',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey,
      })
    default:
      return createOpenAI({ apiKey })
  }
}

export const MODEL_MAP: Record<string, Record<string, string>> = {
  openai: {
    'GPT-4o': 'gpt-4o',
    'GPT-4o-mini': 'gpt-4o-mini',
  },
  deepseek: {
    'DeepSeek Chat': 'deepseek-chat',
    'DeepSeek Reasoner': 'deepseek-reasoner',
  },
  qwen: {
    '千问 VL Max（支持图片）': 'qwen-vl-max',
    '千问 VL Plus（支持图片）': 'qwen-vl-plus',
    '千问 Max': 'qwen-max',
    '千问 Plus': 'qwen-plus',
    '千问 Turbo': 'qwen-turbo',
  },
}
