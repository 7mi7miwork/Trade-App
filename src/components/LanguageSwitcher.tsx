import { useI18n, Language } from '../i18n/context'

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('zh-TW')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
          lang === 'zh-TW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        繁
      </button>
    </div>
  )
}