import { LanguageSwitcher } from './LanguageSwitcher'

interface NavbarProps {
  currentPage: 'main' | 'settings'
  onNavigate: (page: 'main' | 'settings') => void
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const isSettings = currentPage === 'settings'

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isSettings ? (
              <button
                onClick={() => onNavigate('main')}
                className="text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-1"
              >
                ← 返回
              </button>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-slate-900">RoyaBot — 台股分析</h1>
                <p className="text-sm text-slate-500">技術指標 + AI 驅動的股票分析</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isSettings && (
              <button
                onClick={() => onNavigate('settings')}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="設定"
              >
                ⚙️
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}