import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface SubNavItem {
  name: string
  href: string
}

interface NavItem {
  name: string
  href?: string
  icon: React.ReactNode
  roles?: string[]
  subItems?: SubNavItem[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard', href: '/',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
  },
  {
    name: 'Leads', href: '/leads',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" /></svg>,
    roles: ['Admin', 'Sales'],
  },
  {
    name: 'Projects', href: '/projects',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>,
    roles: ['Admin', 'Architect', 'Sales'],
  },
  {
    name: 'Billing',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>,
    roles: ['Admin', 'Accounts'],
    subItems: [
      { name: 'Invoices', href: '/invoices' },
      { name: 'Quotes', href: '/quotes' },
      { name: 'Proposals', href: '/proposals' },
    ]
  },
  {
    name: 'Reports',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    roles: ['Admin', 'Accounts', 'Architect'],
    subItems: [
      { name: 'Financials', href: '/reports' },
      { name: 'AI Project Manager', href: '/reports/ai-manager' },
    ]
  },
  {
    name: 'Users', href: '/users',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
    roles: ['Admin'],
  },
  {
    name: 'Employees', href: '/employees',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
    roles: ['Admin', 'Manager'],
  },
  {
    name: 'Attendance', href: '/attendance',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
  },
  {
    name: 'Payroll', href: '/payroll',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>,
    roles: ['Admin', 'Accounts'],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()

  // Keep billing expanded if we are inside a billing route
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Billing': ['/invoices', '/quotes', '/proposals'].some(path => location.pathname.startsWith(path)),
    'Reports': ['/reports'].some(path => location.pathname.startsWith(path))
  })

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || 'Admin')
  )

  const isActive = (href?: string) =>
    href ? (href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)) : false

  return (
    <div
      className="flex flex-col w-56 flex-shrink-0 crm-sidebar print:hidden"
      style={{ background: 'var(--crm-sidebar)', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Arvayon</div>
            <div className="text-blue-300 text-[10px] font-medium tracking-wide">PMC & Consultancy</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-semibold text-blue-300/60 uppercase tracking-widest px-2 mb-1">
            Main Menu
          </p>
        </div>
        <div className="space-y-0.5 px-3">
          {filteredNav.map((item) => {
            const hasSub = !!item.subItems
            const active = hasSub
              ? item.subItems!.some(sub => isActive(sub.href))
              : isActive(item.href)

            const isOpen = openMenus[item.name]

            return (
              <div key={item.name}>
                {hasSub ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active || isOpen
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active || isOpen ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                      {item.name}
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={item.href!}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className={active ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                    {item.name}
                  </Link>
                )}

                {hasSub && isOpen && (
                  <div className="mt-1 ml-9 space-y-1">
                    {item.subItems!.map(sub => (
                      <Link
                        key={sub.name}
                        to={sub.href}
                        className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isActive(sub.href)
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-xs font-semibold truncate">{user?.name || 'Admin'}</div>
            <div className="text-blue-300 text-[10px] truncate">{user?.role || 'Admin'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
