import { NavLink, Outlet } from 'react-router-dom'
import { t, useDarkMode } from '@flightflow/shared'

const mainNav = () => [
  { to: '/',         label: t('an.nav.overview'), exact: true, icon: <GridIcon /> },
  { to: '/flights',  label: t('an.nav.flights'),              icon: <PlaneIcon /> },
  { to: '/aircraft', label: t('an.nav.aircraft'),             icon: <AircraftIcon /> },
]

export function Layout() {
  const [dark, toggleDark] = useDarkMode('ff:dark-mode', true)

  return (
    <div className="min-h-screen font-sans">
      {/* Top header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-black/5 dark:border-white/8">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <svg className="w-5 h-5 text-[#007AFF]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h-1A1.5 1.5 0 0 0 9 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16Z" />
            </svg>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">FlightFlow</span>
            <span className="text-xs text-gray-400 font-normal hidden sm:inline">Analytics</span>
          </div>

          {/* Main nav — hidden on mobile (bottom bar handles it) */}
          <nav className="hidden md:flex gap-1 flex-1 ml-4">
            {mainNav().map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#007AFF]/10 text-[#007AFF] font-medium dark:bg-[#007AFF]/15 dark:text-[#007AFF]'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-[#8E8E93] dark:hover:text-white dark:hover:bg-white/8'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Right section: Estado + dark mode */}
          <div className="flex items-center gap-1">
            <NavLink
              to="/status"
              className={({ isActive }) =>
                `hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#007AFF]/10 text-[#007AFF] font-medium dark:bg-[#007AFF]/15 dark:text-[#007AFF]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 dark:text-[#8E8E93] dark:hover:text-white dark:hover:bg-white/8'
                }`
              }
            >
              <AntennaIcon />
              <span className="text-xs font-medium">{t('an.nav.status')}</span>
            </NavLink>

            <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

            <button
              onClick={toggleDark}
              aria-label={t('common.toggleDark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content — extra padding bottom on mobile for the bottom nav */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:py-8 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 md:hidden z-50 glass-strong border-t border-black/5 dark:border-white/8">
        <div className="flex">
          {mainNav().map(({ to, label, exact, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#007AFF]'
                    : 'text-gray-400 dark:text-[#636366]'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/status"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#007AFF]'
                  : 'text-gray-400 dark:text-[#636366]'
              }`
            }
          >
            <AntennaIcon />
            {t('an.nav.status')}
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

function AntennaIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12" y2="20.5" strokeWidth="3" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2h-1A1.5 1.5 0 0 0 9 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L12 19v-5.5L21 16Z" />
    </svg>
  )
}

function AircraftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
