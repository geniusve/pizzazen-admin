import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'

const navItems = [
  { path: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { path: '/pizzerie',    icon: '🍕', label: 'Pizzerie' },
  { path: '/ingredienti', icon: '🥗', label: 'Ingredienti' },
  { path: '/clienti',     icon: '👤', label: 'Clienti' },
]

export default function Layout({ children }) {
  const { utente, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col">

        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
              🍕
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-none">PizzaZen</h1>
              <p className="text-blue-400 text-xs font-medium">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {utente?.nome?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{utente?.nome}</p>
              <p className="text-slate-400 text-xs">Super Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition text-lg"
              title="Esci"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
