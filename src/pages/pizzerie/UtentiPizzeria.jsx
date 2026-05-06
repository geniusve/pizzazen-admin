import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm appearance-none"

const TIPI = {
  admin_pizzeria: { label: 'Admin',          color: 'bg-purple-100 text-purple-700' },
  cassiere:       { label: 'Cassiere',       color: 'bg-blue-100 text-blue-700' },
  visualizzatore: { label: 'Visualizzatore', color: 'bg-gray-100 text-gray-600' },
}

const FORM_VUOTO = {
  username: '', password: '', nome: '', tipo: 'cassiere',
  puo_gestire_menu: false, puo_gestire_clienti: true, puo_vedere_stats: false,
}

export default function UtentiPizzeria() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [modal, setModal]                         = useState(null)
  const [utenteSelezionato, setUtenteSelezionato] = useState(null)
  const [form, setForm]                           = useState(FORM_VUOTO)
  const [nuovaPassword, setNuovaPassword]         = useState('')
  const [errore, setErrore]                       = useState('')

  const { data: pizzeriaData } = useQuery({
    queryKey: ['pizzeria', id],
    queryFn:  () => api.get(`/admin/pizzerie/${id}`),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['utenti', id],
    queryFn:  () => api.get(`/admin/pizzerie/${id}/utenti`),
  })

  const ricarica = () => queryClient.invalidateQueries({ queryKey: ['utenti', id], refetchType: 'all' })

  const crea = useMutation({
    mutationFn: () => api.post(`/admin/pizzerie/${id}/utenti`, form),
    onSuccess: () => { ricarica(); chiudiModal() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const aggiorna = useMutation({
    mutationFn: (utId) => api.put(`/admin/pizzerie/${id}/utenti/${utId}`, {
      nome:                form.nome,
      tipo:                form.tipo,
      puo_gestire_menu:    form.puo_gestire_menu,
      puo_gestire_clienti: form.puo_gestire_clienti,
      puo_vedere_stats:    form.puo_vedere_stats,
    }),
    onSuccess: () => { ricarica(); chiudiModal() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nel salvataggio'),
  })

  // Disattiva — soft delete (attivo = false)
  const disattiva = useMutation({
    mutationFn: (utId) => api.delete(`/admin/pizzerie/${id}/utenti/${utId}`),
    onSuccess: () => ricarica(),
  })

  // Riattiva — PATCH /riattiva
  const riattiva = useMutation({
    mutationFn: (utId) => api.patch(`/admin/pizzerie/${id}/utenti/${utId}/riattiva`),
    onSuccess: () => ricarica(),
  })

  // Elimina fisico — DELETE /elimina
  const elimina = useMutation({
    mutationFn: (utId) => api.delete(`/admin/pizzerie/${id}/utenti/${utId}/elimina`),
    onSuccess: () => ricarica(),
  })

  const resetPassword = useMutation({
    mutationFn: (utId) => api.post(
      `/admin/pizzerie/${id}/utenti/${utId}/reset-password`,
      { nuova_password: nuovaPassword }
    ),
    onSuccess: () => chiudiModal(),
    onError:   (err) => setErrore(err?.messaggio || 'Errore reset password'),
  })

  const chiudiModal = () => {
    setModal(null)
    setUtenteSelezionato(null)
    setForm(FORM_VUOTO)
    setNuovaPassword('')
    setErrore('')
  }

  const apriModifica = (u) => {
    setUtenteSelezionato(u)
    setForm({
      nome:                u.nome || '',
      tipo:                u.tipo,
      puo_gestire_menu:    u.puo_gestire_menu,
      puo_gestire_clienti: u.puo_gestire_clienti,
      puo_vedere_stats:    u.puo_vedere_stats,
    })
    setModal('modifica')
    setErrore('')
  }

  const set = (campo, valore) => setForm(f => ({ ...f, [campo]: valore }))

  const utenti    = data?.data || []
  const pizzeria  = pizzeriaData?.data
  const attivi    = utenti.filter(u => u.attivo)
  const disattivi = utenti.filter(u => !u.attivo)

  const FormPermessi = ({ tipo }) => tipo === 'cassiere' ? (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <p className="text-sm font-medium text-gray-600 mb-3">Permessi aggiuntivi</p>
      <div className="space-y-2">
        {[
          { campo: 'puo_gestire_menu',    label: 'Può gestire il menu' },
          { campo: 'puo_gestire_clienti', label: 'Può gestire i clienti' },
          { campo: 'puo_vedere_stats',    label: 'Può vedere le statistiche' },
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
  ) : null

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/pizzerie')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all shadow-sm mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Torna alla lista
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utenti — {pizzeria?.nome}</h1>
            <p className="text-gray-500 text-sm mt-1">{utenti.length} utenti registrati</p>
          </div>
          <button
            onClick={() => { setForm(FORM_VUOTO); setModal('crea'); setErrore('') }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200 text-sm"
          >
            + Nuovo utente
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Caricamento...</div>
      ) : (
        <>
          {/* Attivi */}
          <div className="space-y-3 mb-6">
            {attivi.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-3xl mb-2">👤</p>
                <p className="text-gray-500">Nessun utente attivo</p>
              </div>
            )}
            {attivi.map(u => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  {(u.nome || u.username)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">{u.nome || u.username}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPI[u.tipo]?.color}`}>
                      {TIPI[u.tipo]?.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">@{u.username}</p>
                  {u.ultimo_accesso && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      Ultimo accesso: {new Date(u.ultimo_accesso).toLocaleDateString('it-IT')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => apriModifica(u)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition">
                    Modifica
                  </button>
                  <button onClick={() => { setUtenteSelezionato(u); setNuovaPassword(''); setModal('reset'); setErrore('') }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition">
                    Password
                  </button>
                  <button onClick={() => { setUtenteSelezionato(u); setModal('disattiva') }}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-medium transition">
                    Disattiva
                  </button>
                  <button onClick={() => { setUtenteSelezionato(u); setModal('elimina') }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition">
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Disattivati */}
          {disattivi.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-500 text-sm">Disattivati ({disattivi.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {disattivi.map(u => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="flex-1 text-gray-400 text-sm">@{u.username} — {u.nome}</span>
                    <div className="flex gap-2">
                      <button onClick={() => riattiva.mutate(u.id)}
                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition">
                        Riattiva
                      </button>
                      <button onClick={() => { setUtenteSelezionato(u); setModal('elimina') }}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition">
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODALI */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">

            {/* CREA */}
            {modal === 'crea' && (
              <>
                <h3 className="font-bold text-gray-900 mb-4">Nuovo utente</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                      <input value={form.nome} onChange={e => set('nome', e.target.value)}
                        placeholder="Mario Rossi" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
                      <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                        <option value="cassiere">Cassiere</option>
                        <option value="admin_pizzeria">Admin pizzeria</option>
                        <option value="visualizzatore">Visualizzatore</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Username *</label>
                    <input value={form.username} onChange={e => set('username', e.target.value)}
                      placeholder="mario" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Password *</label>
                    <input type="password" value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="min 6 caratteri" className={inputCls} />
                  </div>
                  <FormPermessi tipo={form.tipo} />
                </div>
                {errore && <p className="text-red-500 text-sm mt-3">⚠️ {errore}</p>}
                <div className="flex gap-3 mt-5">
                  <button onClick={chiudiModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                    Annulla
                  </button>
                  <button onClick={() => crea.mutate()}
                    disabled={!form.username || !form.password || crea.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 disabled:bg-blue-300 transition">
                    {crea.isPending ? 'Creazione...' : 'Crea utente'}
                  </button>
                </div>
              </>
            )}

            {/* MODIFICA */}
            {modal === 'modifica' && (
              <>
                <h3 className="font-bold text-gray-900 mb-1">Modifica utente</h3>
                <p className="text-gray-400 text-sm mb-4">@{utenteSelezionato?.username}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                    <input value={form.nome} onChange={e => set('nome', e.target.value)}
                      placeholder="Mario Rossi" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
                    <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputCls}>
                      <option value="cassiere">Cassiere</option>
                      <option value="admin_pizzeria">Admin pizzeria</option>
                      <option value="visualizzatore">Visualizzatore</option>
                    </select>
                  </div>
                  <FormPermessi tipo={form.tipo} />
                </div>
                {errore && <p className="text-red-500 text-sm mt-3">⚠️ {errore}</p>}
                <div className="flex gap-3 mt-5">
                  <button onClick={chiudiModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                    Annulla
                  </button>
                  <button onClick={() => aggiorna.mutate(utenteSelezionato.id)}
                    disabled={aggiorna.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 disabled:bg-blue-300 transition">
                    {aggiorna.isPending ? 'Salvataggio...' : 'Salva modifiche'}
                  </button>
                </div>
              </>
            )}

            {/* RESET PASSWORD */}
            {modal === 'reset' && (
              <>
                <h3 className="font-bold text-gray-900 mb-1">Reset password</h3>
                <p className="text-gray-400 text-sm mb-4">@{utenteSelezionato?.username}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nuova password *</label>
                  <input type="password" value={nuovaPassword}
                    onChange={e => setNuovaPassword(e.target.value)}
                    placeholder="min 6 caratteri" minLength={6} className={inputCls} />
                </div>
                {errore && <p className="text-red-500 text-sm mt-3">⚠️ {errore}</p>}
                <div className="flex gap-3 mt-5">
                  <button onClick={chiudiModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                    Annulla
                  </button>
                  <button onClick={() => resetPassword.mutate(utenteSelezionato.id)}
                    disabled={nuovaPassword.length < 6 || resetPassword.isPending}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-500 disabled:bg-blue-300 transition">
                    {resetPassword.isPending ? 'Salvataggio...' : 'Aggiorna password'}
                  </button>
                </div>
              </>
            )}

            {/* DISATTIVA */}
            {modal === 'disattiva' && (
              <>
                <div className="text-3xl text-center mb-3">⏸️</div>
                <h3 className="font-bold text-gray-900 text-center mb-1">Disattiva utente</h3>
                <p className="text-gray-500 text-sm text-center mb-1">Stai per disattivare:</p>
                <p className="font-semibold text-gray-900 text-center mb-2">
                  {utenteSelezionato?.nome || utenteSelezionato?.username}
                </p>
                <p className="text-xs text-gray-400 text-center mb-5">
                  L'utente non potrà accedere ma potrà essere riattivato in qualsiasi momento.
                </p>
                <div className="flex gap-3">
                  <button onClick={chiudiModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                    Annulla
                  </button>
                  <button
                    onClick={() => {
                      const utId = utenteSelezionato.id
                      chiudiModal()
                      disattiva.mutate(utId)
                    }}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition">
                    Disattiva
                  </button>
                </div>
              </>
            )}

            {/* ELIMINA */}
            {modal === 'elimina' && (
              <>
                <div className="text-3xl text-center mb-3">⚠️</div>
                <h3 className="font-bold text-gray-900 text-center mb-1">Elimina utente</h3>
                <p className="text-gray-500 text-sm text-center mb-1">Stai per eliminare definitivamente:</p>
                <p className="font-semibold text-gray-900 text-center mb-2">
                  {utenteSelezionato?.nome || utenteSelezionato?.username}
                </p>
                <p className="text-xs text-gray-400 text-center mb-5">
                  Questa azione non può essere annullata.
                </p>
                <div className="flex gap-3">
                  <button onClick={chiudiModal}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                    Annulla
                  </button>
                  <button
                    onClick={() => {
                      const utId = utenteSelezionato.id
                      chiudiModal()
                      elimina.mutate(utId)
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition">
                    Elimina definitivamente
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
