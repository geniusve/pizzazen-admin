import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/AuthContext'
import Login from '@/pages/auth/Login'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import ListaPizzerie from '@/pages/pizzerie/ListaPizzerie'
import NuovaPizzeria from '@/pages/pizzerie/NuovaPizzeria'
import ModificaPizzeria from '@/pages/pizzerie/ModificaPizzeria'
import UtentiPizzeria from '@/pages/pizzerie/UtentiPizzeria'
import IngredientiDefault from '@/pages/ingredienti/IngredientiDefault'
import ListaClienti from '@/pages/clienti/ListaClienti'

function ProtectedRoute({ children }) {
  const { utente, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-white">Caricamento...</p>
    </div>
  )
  if (!utente) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pizzerie" element={<ProtectedRoute><ListaPizzerie /></ProtectedRoute>} />
      <Route path="/pizzerie/nuova" element={<ProtectedRoute><NuovaPizzeria /></ProtectedRoute>} />
      <Route path="/pizzerie/:id" element={<ProtectedRoute><ModificaPizzeria /></ProtectedRoute>} />
      <Route path="/pizzerie/:id/utenti" element={<ProtectedRoute><UtentiPizzeria /></ProtectedRoute>} />
      <Route path="/ingredienti" element={<ProtectedRoute><IngredientiDefault /></ProtectedRoute>} />
      <Route path="/clienti"     element={<ProtectedRoute><ListaClienti /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
