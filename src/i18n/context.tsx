import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { en } from './en'
import { zhTW } from './zh-TW'

export type Language = 'en' | 'zh-TW'

type TranslationValue = typeof en | typeof zhTW

const LANGUAGE_STORAGE_KEY = 'royabot_lang'

interface I18nContextType {
  lang: Language
  setLang: (l: Language) => void
  t: TranslationValue
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Language, TranslationValue> = {
  en,
  'zh-TW': zhTW,
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      if (stored === 'en' || stored === 'zh-TW') return stored
    } catch { /* ignore */ }
    return 'zh-TW'
  })

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch { /* ignore */ }
  }, [lang])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
  }, [])

  const t = translations[lang]

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}