import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { useApiKeys, ApiProvider } from '../hooks/useApiKeys'

interface ProviderConfig {
  id: ApiProvider
  name: string
  color: string
  bgColor: string
  model: string
  freeTier: boolean
  keyUrl: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    model: 'claude-haiku-4-5-20251001',
    freeTier: false,
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    model: 'gemini-1.5-flash',
    freeTier: true,
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'grok',
    name: 'Grok',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    model: 'grok-3-mini',
    freeTier: false,
    keyUrl: 'https://console.x.ai/',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    model: 'gpt-4o-mini',
    freeTier: false,
    keyUrl: 'https://platform.openai.com/api-keys',
  },
]

export function SettingsPage() {
  const { t } = useI18n()
  const { getKey, setKey, hasKey } = useApiKeys()
  const [visibleKeys, setVisibleKeys] = useState<Partial<Record<ApiProvider, boolean>>>({})

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t.settingsTitle}</h2>
        <p className="text-slate-500 mt-1">{t.settingsSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => {
          const currentVal = getKey(p.id)
          const isSet = hasKey(p.id)
          const isVis = visibleKeys[p.id] || false

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${p.bgColor} ${p.color}`}>
                    {p.name[0]}
                  </span>
                  <span className="font-semibold text-slate-800">{p.name}</span>
                  {p.freeTier && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      {t.settingsFreeTier}
                    </span>
                  )}
                </div>
                {isSet ? (
                  <span className="text-green-600 text-sm">✓ {t.settingsKeySaved}</span>
                ) : (
                  <span className="text-gray-400 text-sm">{t.settingsKeyEmpty}</span>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {(t.settingsModelUsed as (m: string) => string)(p.model)}
              </p>

              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <input
                    type={isVis ? 'text' : 'password'}
                    value={currentVal}
                    onChange={(e) => setKey(p.id, e.target.value)}
                    placeholder={t.settingsKeyLabel}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    onClick={() => setVisibleKeys((v) => ({ ...v, [p.id]: !v[p.id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    type="button"
                  >
                    {isVis ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setKey(p.id, currentVal)}
                  disabled={currentVal.length === 0}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentVal.length > 0
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {t.settingsSave}
                </button>
                <button
                  onClick={() => setKey(p.id, '')}
                  disabled={!isSet}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isSet
                      ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {t.settingsClear}
                </button>
                <a
                  href={p.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                >
                  {t.settingsGetKey}
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}