import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Images, Languages, Layers, KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getEffectiveToken } from '../figma/token';

const navItems = [
  { to: '/images', icon: Images, label: 'Images' },
  { to: '/localization', icon: Languages, label: 'Localization' },
];

export default function Sidebar() {
  const { figmaToken, setFigmaToken } = useStore();
  const effectiveToken = getEffectiveToken(figmaToken);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(figmaToken);

  function handleSave() {
    setFigmaToken(input.trim());
    setOpen(false);
  }

  return (
    <>
      <aside className="flex flex-col items-center w-16 min-h-screen bg-white border-r border-gray-200 py-4 gap-1 z-30 relative">
        <div className="flex items-center justify-center w-10 h-10 mb-6">
          <Layers className="w-7 h-7 text-violet-600" />
        </div>

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5 transition-colors ${
                isActive
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}

        {/* Token button pinned to bottom of sidebar */}
        <div className="mt-auto">
          <button
            onClick={() => { setInput(figmaToken); setOpen(!open); }}
            title="Figma token"
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl gap-0.5 transition-colors ${
              effectiveToken
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-amber-500 hover:bg-amber-50'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            <span className="text-[10px] font-medium">Token</span>
          </button>
        </div>
      </aside>

      {/* Token panel — flies out from sidebar */}
      {open && (
        <div className="fixed left-16 bottom-4 z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Figma token</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs">
              {import.meta.env.VITE_FIGMA_TOKEN ? (
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  VITE_FIGMA_TOKEN detected in .env.local
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  VITE_FIGMA_TOKEN not in .env.local
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Or paste your token here directly. Get one at{' '}
              <a href="https://www.figma.com/settings" target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">
                figma.com/settings
              </a>{' '}
              → Personal access tokens.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="figd_…"
                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={!input.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
            </div>
            {effectiveToken && (
              <p className="text-[11px] text-gray-400">
                Active token: <span className="font-mono">{effectiveToken.slice(0, 8)}…</span>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
