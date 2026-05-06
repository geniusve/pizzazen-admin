import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm appearance-none"

const TIPI = {
  admin_pizzeria: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  cassiere:       { label: 'Cassiere', color: 'bg-blue-100 text-blue-700' },
  visualizzatore: { label: 'Visualizzatore', color: 'bg-gray-100 text-gray-600' },
}

export default function UtentiPizzeria() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [showForm, setShowForm]     = useState(false)
  const [resetId, setResetId]       = useState(null)
  const [nuovaPassword, setNuovaPassword] = useState('')
  const [form, setForm] = useState({
    username: '', password: '', nome: '', tipo: 'cassiere',
    puo_gestire_menu: false, puo_gestire_clienti: true, puo_vedere_stats: false,
  })
  const [errore, setErrore] = useState('')

  // Dati pizzeria
  const { data: pizzeriaData } = useQuery({
    queryKey: ['pizzeria', id],
    queryFn:  () => api.get(`/admin/pizzerie/${id}`),
  })

  // Lista utenti
  const { data, isLoading } = useQuery({
    queryKey: ['utenti', id],
    queryFn:  () => api.get(`/admin/pizzerie/${id}/utenti`),
  })

  const crea = useMutation({
    mutationFn: () => api.post(`/admin/pizzerie/${id}/utenti`, form),
    onSuccess: () => {
      queryClient.invalidateQueries(['utenti', id])
      setShowForm(false)
      setForm({ username: '', password: '', nome: '', tipo: 'cassiere',
        puo_gestire_menu: false, puo_gestire_clienti: true, puo_vedere_stats: false })
      setErrore('')
    },
    onError: (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const disattiva = useMutation({
    mutationFn: (utId) => api.delete(`/admin/pizzerie/${id}/utenti/${utId}`),
    onSuccess: () => queryClient.invalidateQueries(['utenti', id]),
  })

  const resetPassword = useMutation({
    mutationFn: (utId) => api.post(
      `/admin/pizzerie/${id}/utenti/${utId}/reset-password`,
      { nuova_password: nuovaPassword }
    ),
    onSuccess: () => {
      setResetId(null)
      setNuovaPassword('')
    },
    onError: (err) => setErrore(err?.messaggio || 'Errore reset password'),
  })

  const utenti   = data?.data || []
  const pizzeria = pizzeriaData?.data

  const set = (campo, valore) => setForm(f => ({ ...f, [campo]: valore }))

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/pizzerie')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Torna alla lista
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Utenti — {pizzeria?.nome}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {utenti.length} utenti registrati
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setErrore('') }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200 text-sm"
          >
            + Nuovo utente
          </button>
        </div>
      </div>

      {/* Form nuovo utente */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Nuovo utente</h3>
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Nome</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)}
                  placeholder="Mario Rossi" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                  <option value="cassiere">Cassiere</option>
                  <option value="admin_pizzeria">Admin pizzeria</option>
                  <option value="visualizzatore">Visualizzatore</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Username *</label>
              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="mario" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password *</label>
              <input type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="min 6 caratteri" minLength={6} className={inputCls} />
            </div>

            {/* Permessi (solo per cassiere) */}
            {form.tipo === 'cassiere' && (
              <div className="col-span-2 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-600 mb-3">Permessi aggiuntivi</p>
                <div className="flex gap-6">
                  {[
                    { campo: 'puo_gestire_menu',    label: 'Gestire menu' },
                    { campo: 'puo_gestire_clienti', label: 'Gestire clienti' },
                    { campo: 'puo_vedere_stats',    label: 'Vedere statistiche' },
                  ].map(p => (
                    <label key={p.campo} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[p.campo]}
                        onChange={e => set(p.campo, e.target.checked)}
                        className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-600">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {errore && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">⚠️ {errore}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={() => { setShowForm(false); setErrore('') }}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">
              Annulla
            </button>
            <button
              onClick={() => crea.mutate()}
              disabled={!form.username || !form.password || crea.isPending}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl transition text-sm">
              {crea.isPending ? 'Creazione...' : 'Crea utente'}
            </button>
          </div>
        </div>
      )}

      {/* Lista utenti */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Caricamento...</div>
      ) : utenti.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-3xl mb-2">👤</p>
          <p className="text-gray-500">Nessun utente trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {utenti.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">

              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                {(u.nome || u.username)[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900">{u.nome || u.username}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPI[u.tipo]?.color}`}>
                    {TIPI[u.tipo]?.label}
                  </span>
                  {!u.attivo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                      Disattivato
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">@{u.username}</p>
                {u.ultimo_accesso && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    Ultimo accesso: {new Date(u.ultimo_accesso).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setResetId(u.id); setNuovaPassword(''); setErrore('') }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition"
                >
                  Reset password
                </button>
                {u.attivo && (
                  <button
                    onClick={() => disattiva.mutate(u.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                  >
                    Disattiva
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal reset password */}
      {resetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Reset password</h3>
            <p className="text-gray-500 text-sm mb-4">Inserisci la nuova password per questo utente</p>
            <input
              type="password"
              value={nuovaPassword}
              onChange={e => setNuovaPassword(e.target.value)}
              placeholder="Nuova password (min 6 caratteri)"
              className={inputCls + ' mb-4'}
              minLength={6}
            />
            {errore && <p className="text-red-500 text-sm mb-3">⚠️ {errore}</p>}
            <div className="flex gap-3">
              <button onClick={() => setResetId(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                Annulla
              </button>
              <button
                onClick={() => resetPassword.mutate(resetId)}
                disabled={nuovaPassword.length < 6 || resetPassword.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 disabled:bg-blue-300 transition">
                {resetPassword.isPending ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
