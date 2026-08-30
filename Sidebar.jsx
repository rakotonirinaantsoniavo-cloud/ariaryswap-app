import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: 'fa-chart-simple', label: 'Accueil', end: true },
  { to: '/exchange', icon: 'fa-right-left', label: 'Échanger' },
  { to: '/orders', icon: 'fa-receipt', label: 'Ordres' },
  { to: '/wallet', icon: 'fa-wallet', label: 'Portefeuille' },
]

export default function Sidebar() {
  const { isAdmin } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-sm2 text-[10px] font-semibold tracking-wide transition-colors relative ` +
    (isActive ? 'bg-bgCardHover text-vanillaLight' : 'text-textSecondary hover:bg-bgCard hover:text-textPrimary')

  return (
    <aside className="w-[84px] bg-bgSecondary border-r border-borderC flex flex-col items-center py-6 pb-7 flex-shrink-0">
      <div className="w-[46px] h-[46px] rounded-xl bg-gradient-to-br from-[#c98a2a] via-[#e8bb56] to-[#f0cf7f] flex items-center justify-center mb-2 shadow-lg shadow-vanilla/20">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path d="M12 2C9 7 5 9 5 14a7 7 0 0014 0c0-5-4-7-7-12z" fill="#14150f" />
        </svg>
      </div>
      <div className="font-display text-[11px] font-semibold text-textMuted tracking-[1.5px] uppercase mb-8">
        AriarySwap
      </div>

      <nav className="flex flex-col gap-1.5 flex-1 w-full px-3.5">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={linkClass}>
            <i className="fa-solid fa-user-shield text-lg"></i>
            Admin
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
