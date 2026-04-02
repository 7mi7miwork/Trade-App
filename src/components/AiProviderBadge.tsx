import { AiProvider } from '../services/ai/types'
import { useI18n } from '../i18n/context'

interface AiProviderBadgeProps {
  provider: AiProvider
  size?: 'sm' | 'md'
}

const PROVIDER_COLORS: Record<AiProvider, { bg: string; text: string }> = {
  claude: { bg: 'bg-purple-100', text: 'text-purple-700' },
  gemini: { bg: 'bg-blue-100', text: 'text-blue-700' },
  grok: { bg: 'bg-slate-100', text: 'text-slate-700' },
  openai: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

const PROVIDER_NAMES: Record<AiProvider, 'providerClaude' | 'providerGemini' | 'providerGrok' | 'providerOpenAI'> = {
  claude: 'providerClaude',
  gemini: 'providerGemini',
  grok: 'providerGrok',
  openai: 'providerOpenAI',
}

export function AiProviderBadge({ provider, size = 'sm' }: AiProviderBadgeProps) {
  const { t } = useI18n()
  const colors = PROVIDER_COLORS[provider]
  const nameKey = PROVIDER_NAMES[provider]
  const sizeCls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors.bg} ${colors.text} ${sizeCls}`}>
      {t[nameKey] as string}
    </span>
  )
}