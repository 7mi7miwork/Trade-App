export type ApiProvider = 'claude' | 'gemini' | 'grok' | 'openai'

const STORAGE_KEYS: Record<ApiProvider, string> = {
  claude: 'ak_c',
  gemini: 'ak_g',
  grok: 'ak_x',
  openai: 'ak_o',
}

const ENV_KEYS: Record<ApiProvider, string> = {
  claude: 'VITE_ANTHROPIC_API_KEY',
  gemini: 'VITE_GEMINI_API_KEY',
  grok: 'VITE_GROK_API_KEY',
  openai: 'VITE_OPENAI_API_KEY',
}

function encode(val: string): string {
  try { return btoa(val) } catch { return val }
}

function decode(val: string): string {
  try { return atob(val) } catch { return val }
}

export function useApiKeys() {
  const getKey = (provider: ApiProvider): string => {
    // First check env (for local dev)
    const envVal = import.meta.env?.[ENV_KEYS[provider]]
    if (envVal) return envVal as string

    // Then check localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS[provider])
      if (stored) return decode(stored)
    } catch { /* ignore */ }
    return ''
  }

  const setKey = (provider: ApiProvider, value: string): void => {
    try {
      if (!value) {
        localStorage.removeItem(STORAGE_KEYS[provider])
      } else {
        localStorage.setItem(STORAGE_KEYS[provider], encode(value))
      }
    } catch { /* ignore */ }
  }

  const clearKey = (provider: ApiProvider): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS[provider])
    } catch { /* ignore */ }
  }

  const hasKey = (provider: ApiProvider): boolean => {
    return getKey(provider).length > 0
  }

  const getAllKeys = (): Partial<Record<ApiProvider, string>> => {
    const result: Partial<Record<ApiProvider, string>> = {}
    const providers: ApiProvider[] = ['claude', 'gemini', 'grok', 'openai']
    for (const p of providers) {
      const key = getKey(p)
      if (key) result[p] = key
    }
    return result
  }

  return { getKey, setKey, clearKey, hasKey, getAllKeys }
}