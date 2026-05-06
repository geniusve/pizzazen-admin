import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const ALLERGENI_LIST = [
  { id: 'glutine',            label: 'Glutine' },
  { id: 'latte',              label: 'Latte' },
  { id: 'uova',               label: 'Uova' },
  { id: 'pesce',              label: 'Pesce' },
  { id: 'crostacei',          label: 'Crostacei' },
  { id: 'arachidi',           label: 'Arachidi' },
  { id: 'soia',               label: 'Soia' },
  { id: 'frutta_a_guscio',    label: 'Frutta a guscio' },
  { id: 'sedano',             label: 'Sedano' },
  { id: 'senape',             label: 'Senape' },
  { id: 'sesamo',             label: 'Sesamo' },
  { id: 'anidride_solforosa', label: 'Anidride solforosa' },
  { id: 'lupini',             label: 'Lupini' },
  { id: 'molluschi',          label: 'Molluschi' },
]

const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"

// Bottone allergene — classi statiche per evitare problemi Tailwind JIT
function BtnAllergene({ label, selezionato, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selezionato ? { backgroundColor: '#f97316', color: '#ffffff' } : {}}
      className={selezionato
        ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white'
        : 'px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200'
      }
    >
      {selezionato ? `✓ ${label}` : label}
    </button>
  )
}

export default function IngredientiDefault() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [cerca, setCerca]       = useState('')
  const [errore, setErrore]     = useState('')
  const [form, setForm] = useState({
    descrizione: '', prezzo: '0', nota: '', allergeni: []
  })

  const { data, isLoading } = useQuery({
    queryKey: ['ingredienti-default'],
    queryFn:  () => api.get('/admin/ingredienti'),
  })

  const crea = useMutation({
    mutationFn: () => api.post('/admin/ingredienti', {
      ...form,
      prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
    }),
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); resetForm() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const aggiorna = useMutation({
    mutationFn: () => api.put(`/admin/ingredienti/${editId}`, {
      ...form,
      prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
    }),
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); resetForm() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nel salvataggio'),
  })

  const disattiva = useMutation({
    mutationFn: (id) => api.delete(`/admin/ingredienti/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['ingredienti-default']),
  })

  const riattiva = useMutation({
    mutationFn: (id) => api.put(`/admin/ingredienti/${id}`, { attivo: true }),
    onSuccess: () => queryClient.invalidateQueries(['ingredienti-default']),
  })

  const resetForm = () => {
    setForm({ descrizione: '', prezzo: '0', nota: '', allergeni: [] })
    setShowForm(false)
    setEditId(null)
    setErrore('')
  }

  const startEdit = (ing) => {
    setForm({
      descrizione: ing.descrizione,
      prezzo:      String(ing.prezzo).replace('.', ','),
      nota:        ing.nota || '',
      allergeni:   ing.allergeni || [],
    })
    setEditId(ing.id)
    setShowForm(true)
    setErrore('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleAllergene = (id) => {
    setForm(f => ({
      ...f,
      allergeni: f.allergeni.includes(id)
        ? f.allergeni.filter(x => x !== id)
        : [...f.allergeni, id]
    }))
  }

  const isDuplicato = (descrizione) => {
    if (!descrizione.trim()) return false
    return (data?.data || []).some(i =>
      i.descrizione.toLowerCase() === descrizione.toLowerCase() && i.id !== editId
    )
  }

  const ingredienti = (data?.data || []).filter(i =>
    i.descrizione.toLowerCase().includes(cerca.toLowerCase())
  )
  const attivi    = ingredienti.filter(i => i.attivo)
  const disattivi = ingredienti.filter(i => !i.attivo)
  const duplicato = isDuplicato(form.descrizione)

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingredienti default</h1>
            <p className="text-gray-500 text-sm mt-1">
              Clonati automaticamente per ogni nuova pizzeria
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200 text-sm"
          >
            + Nuovo ingrediente
          </button>
        </div>

        {/* Cerca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cerca ingrediente..."
            value={cerca}
            onChange={e => setCerca(e.target.value)}
            className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>

        {/* Form crea/modifica */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">
              {editId ? 'Modifica ingrediente' : 'Nuovo ingrediente'}
            </h3>

            {/* Riga: descrizione + prezzo (piccolo) */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Descrizione *</label>
                <input
                  value={form.descrizione}
                  onChange={e => { setForm(f => ({ ...f, descrizione: e.target.value })); if (errore) setErrore('') }}
                  placeholder="es: Mozzarella"
                  className={`${inputCls} ${duplicato ? 'border-red-400 focus:ring-red-400' : ''}`}
                />
                {duplicato && <p className="text-red-500 text-xs mt-1">⚠️ Esiste già un ingrediente con questo nome</p>}
              </div>
              <div className="w-28 flex-shrink-0">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Prezzo extra (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.prezzo}
                  onChange={e => setForm(f => ({ ...f, prezzo: e.target.value.replace(/[^0-9,.]/, '') }))}
                  onBlur={e => {
                    const num = parseFloat(String(e.target.value).replace(',', '.'))
                    setForm(f => ({ ...f, prezzo: isNaN(num) ? '0' : String(Math.round(num * 100) / 100).replace('.', ',') }))
                  }}
                  placeholder="0,00"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Nota */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Nota (opzionale)</label>
              <input
                value={form.nota}
                onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                placeholder="es: biologico, DOP..."
                className={inputCls}
              />
            </div>

            {/* Allergeni con flex-wrap */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Allergeni</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENI_LIST.map(a => (
                  <BtnAllergene
                    key={a.id}
                    label={a.label}
                    selezionato={form.allergeni.includes(a.id)}
                    onClick={() => toggleAllergene(a.id)}
                  />
                ))}
              </div>
            </div>

            {errore && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">⚠️ {errore}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetForm}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">
                Annulla
              </button>
              <button
                onClick={() => editId ? aggiorna.mutate() : crea.mutate()}
                disabled={!form.descrizione || duplicato || crea.isPending || aggiorna.isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl transition text-sm">
                {(crea.isPending || aggiorna.isPending) ? 'Salvataggio...' : editId ? 'Salva modifiche' : 'Crea ingrediente'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Caricamento...</div>
        ) : (
          <>
            {/* Attivi */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  Attivi <span className="text-sm font-normal text-gray-400">({attivi.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {attivi.length === 0 && (
                  <p className="px-6 py-4 text-gray-400 text-sm">Nessun ingrediente attivo</p>
                )}
                {attivi.map(ing => (
                  <div key={ing.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{ing.descrizione}</span>
                        {(ing.allergeni || []).map(aId => {
                          const a = ALLERGENI_LIST.find(x => x.id === aId)
                          return (
                            <span key={aId} className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">
                              {a?.label || aId}
                            </span>
                          )
                        })}
                      </div>
                      {ing.nota && <p className="text-gray-400 text-xs mt-0.5">{ing.nota}</p>}
                    </div>
                    <span className="text-gray-500 text-sm font-medium flex-shrink-0 w-20 text-right">
                      {parseFloat(ing.prezzo) > 0 ? `+€${parseFloat(ing.prezzo).toFixed(2)}` : 'Incluso'}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(ing)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition">
                        Modifica
                      </button>
                      <button onClick={() => disattiva.mutate(ing.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition">
                        Disattiva
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disattivati */}
            {disattivi.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-500 text-sm">
                    Disattivati ({disattivi.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {disattivi.map(ing => (
                    <div key={ing.id} className="px-6 py-3 flex items-center gap-4">
                      <span className="flex-1 text-gray-400 text-sm">{ing.descrizione}</span>
                      <button onClick={() => riattiva.mutate(ing.id)}
                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition flex-shrink-0">
                        Riattiva
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
