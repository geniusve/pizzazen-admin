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

function BtnAllergene({ label, selezionato, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selezionato
        ? { backgroundColor: '#f97316', color: '#ffffff' }
        : { backgroundColor: '#f3f4f6', color: '#4b5563' }
      }
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 whitespace-nowrap"
    >
      {selezionato ? `✓ ${label}` : label}
    </button>
  )
}

export default function IngredientiDefault() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm]               = useState(false)
  const [editId, setEditId]                   = useState(null)
  const [cerca, setCerca]                     = useState('')
  const [errore, setErrore]                   = useState('')
  const [confermaElimina, setConfermaElimina] = useState(null)
  const [form, setForm] = useState({
    descrizione: '', prezzo: '0', nota: '', allergeni: []
  })

  const { data, isLoading } = useQuery({
    queryKey: ['ingredienti-default'],
    queryFn:  () => api.get('/admin/ingredienti'),
  })

  const crea = useMutation({
    mutationFn: () => api.post('/admin/ingredienti', {
      ...form, prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
    }),
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); resetForm() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const aggiorna = useMutation({
    mutationFn: () => api.put(`/admin/ingredienti/${editId}`, {
      ...form, prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
    }),
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); resetForm() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nel salvataggio'),
  })

  const elimina = useMutation({
    mutationFn: (id) => api.delete(`/admin/ingredienti/${id}`),
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
  const duplicato = isDuplicato(form.descrizione)

  return (
    <div className="p-6 h-full overflow-auto">
      <div style={{ maxWidth: '720px' }} className="mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingredienti default</h1>
            <p className="text-gray-500 text-sm mt-1">Clonati automaticamente per ogni nuova pizzeria</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm"
          >
            + Nuovo
          </button>
        </div>

        {/* Cerca */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Cerca ingrediente..."
            value={cerca}
            onChange={e => setCerca(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-900 mb-4">
              {editId ? 'Modifica ingrediente' : 'Nuovo ingrediente'}
            </h3>

            <div className="flex gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-600 mb-1">Descrizione *</label>
                <input
                  value={form.descrizione}
                  onChange={e => { setForm(f => ({ ...f, descrizione: e.target.value })); if (errore) setErrore('') }}
                  placeholder="es: Mozzarella"
                  className={`${inputCls} ${duplicato ? 'border-red-400' : ''}`}
                />
                {duplicato && <p className="text-red-500 text-xs mt-1">⚠️ Nome già esistente</p>}
              </div>
              <div style={{ width: '100px' }} className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-600 mb-1">€ extra</label>
                <input
                  type="text" inputMode="decimal" value={form.prezzo}
                  onChange={e => setForm(f => ({ ...f, prezzo: e.target.value.replace(/[^0-9,.]/, '') }))}
                  onBlur={e => {
                    const num = parseFloat(String(e.target.value).replace(',', '.'))
                    setForm(f => ({ ...f, prezzo: isNaN(num) ? '0' : String(Math.round(num * 100) / 100).replace('.', ',') }))
                  }}
                  placeholder="0,00" className={inputCls}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Nota (opzionale)</label>
              <input
                value={form.nota}
                onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                placeholder="es: biologico, DOP..."
                className={inputCls}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-600 mb-2">Allergeni</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALLERGENI_LIST.map(a => (
                  <BtnAllergene key={a.id} label={a.label}
                    selezionato={form.allergeni.includes(a.id)}
                    onClick={() => toggleAllergene(a.id)} />
                ))}
              </div>
            </div>

            {errore && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                <p className="text-red-600 text-sm">⚠️ {errore}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetForm}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">
                Annulla
              </button>
              <button
                onClick={() => editId ? aggiorna.mutate() : crea.mutate()}
                disabled={!form.descrizione || duplicato || crea.isPending || aggiorna.isPending}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl transition text-sm">
                {(crea.isPending || aggiorna.isPending) ? 'Salvataggio...' : editId ? 'Salva' : 'Crea'}
              </button>
            </div>
          </div>
        )}

        {/* Lista unica — niente Attivi/Disattivati */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Caricamento...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">
                Ingredienti <span className="font-normal text-gray-400">({ingredienti.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {ingredienti.length === 0 && (
                <p className="px-5 py-4 text-gray-400 text-sm">Nessun ingrediente</p>
              )}
              {ingredienti.map(ing => (
                <div key={ing.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{ing.descrizione}</span>
                      {(ing.allergeni || []).map(aId => {
                        const a = ALLERGENI_LIST.find(x => x.id === aId)
                        return <span key={aId} className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">{a?.label || aId}</span>
                      })}
                    </div>
                    {ing.nota && <p className="text-gray-400 text-xs mt-0.5">{ing.nota}</p>}
                  </div>
                  <span className="text-gray-500 text-xs font-medium flex-shrink-0 w-16 text-right">
                    {parseFloat(ing.prezzo) > 0 ? `+€${parseFloat(ing.prezzo).toFixed(2)}` : 'Incluso'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(ing)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition">
                      Modifica
                    </button>
                    <button onClick={() => setConfermaElimina(ing)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition">
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal conferma eliminazione */}
      {confermaElimina && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="font-bold text-gray-900 text-center mb-2">Elimina ingrediente</h3>
            <p className="text-gray-500 text-sm text-center mb-1">Stai per eliminare definitivamente:</p>
            <p className="font-semibold text-gray-900 text-center mb-2">"{confermaElimina.descrizione}"</p>
            <p className="text-xs text-gray-400 text-center mb-5">
              Le pizzerie già create non saranno influenzate.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfermaElimina(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
                Annulla
              </button>
              <button
                onClick={() => {
                  const ingId = confermaElimina.id
                  setConfermaElimina(null)
                  elimina.mutate(ingId)
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition">
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
