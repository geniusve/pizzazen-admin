import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const CATEGORIE = [
  { id: 'impasto',  label: 'Tipi di Impasto',       emoji: '🌾' },
  { id: 'salse',    label: 'Salse e Creme',          emoji: '🍅' },
  { id: 'formaggi', label: 'Formaggi e Latticini',   emoji: '🧀' },
  { id: 'salumi',   label: 'Salumi e Carni',         emoji: '🥩' },
  { id: 'verdure',  label: 'Verdure e Ortaggi',      emoji: '🥦' },
  { id: 'pesce',    label: 'Pesce e Frutti di Mare', emoji: '🐟' },
  { id: 'extra',    label: 'Erbe, Spezie e Extra',   emoji: '🌿' },
]

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

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://192.168.1.160'
const PLACEHOLDER = `${BASE_URL}/storage/defaults/placeholder/ingrediente-default.png`
const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"

function BtnAllergene({ label, selezionato, onClick }) {
  return (
    <button type="button" onClick={onClick}
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

function IconaIngrediente({ url }) {
  const [errore, setErrore] = useState(false)
  return (
    <img
      src={errore || !url ? PLACEHOLDER : url}
      onError={() => setErrore(true)}
      className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0"
      alt=""
    />
  )
}

const FORM_VUOTO = { descrizione: '', categoria: 'extra', prezzo: '0', nota: '', allergeni: [] }

export default function IngredientiDefault() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const [showModal, setShowModal]             = useState(false)
  const [editId, setEditId]                   = useState(null)
  const [cerca, setCerca]                     = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [errore, setErrore]                   = useState('')
  const [confermaElimina, setConfermaElimina] = useState(null)
  const [iconaPreview, setIconaPreview]       = useState(null)
  const [iconaFile, setIconaFile]             = useState(null)
  const [form, setForm]                       = useState(FORM_VUOTO)

  const { data, isLoading } = useQuery({
    queryKey: ['ingredienti-default'],
    queryFn:  () => api.get('/admin/ingredienti'),
  })

  const crea = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/ingredienti', {
        ...form, prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
      })
      if (iconaFile && res.data?.id) {
        const fd = new FormData()
        fd.append('icona', iconaFile)
        await api.post(`/admin/ingredienti/${res.data.id}/icona`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      return res
    },
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); chiudiModal() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const aggiorna = useMutation({
    mutationFn: async () => {
      await api.put(`/admin/ingredienti/${editId}`, {
        ...form, prezzo: parseFloat(String(form.prezzo).replace(',', '.')) || 0
      })
      if (iconaFile) {
        const fd = new FormData()
        fd.append('icona', iconaFile)
        await api.post(`/admin/ingredienti/${editId}/icona`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
    },
    onSuccess: () => { queryClient.invalidateQueries(['ingredienti-default']); chiudiModal() },
    onError:   (err) => setErrore(err?.messaggio || 'Errore nel salvataggio'),
  })

  const elimina = useMutation({
    mutationFn: (id) => api.delete(`/admin/ingredienti/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['ingredienti-default']),
  })

  const apriNuovo = () => {
    setForm(FORM_VUOTO)
    setEditId(null)
    setIconaPreview(null)
    setIconaFile(null)
    setErrore('')
    setShowModal(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const apriModifica = (ing) => {
    setForm({
      descrizione: ing.descrizione,
      categoria:   ing.categoria || 'extra',
      prezzo:      String(ing.prezzo).replace('.', ','),
      nota:        ing.nota || '',
      allergeni:   ing.allergeni || [],
    })
    setEditId(ing.id)
    setIconaPreview(ing.icona_url || null)
    setIconaFile(null)
    setErrore('')
    setShowModal(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const chiudiModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm(FORM_VUOTO)
    setIconaPreview(null)
    setIconaFile(null)
    setErrore('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleIconaChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIconaFile(file)
    setIconaPreview(URL.createObjectURL(file))
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

  const tutti = data?.data || []
  const filtrati = tutti.filter(i => {
    const matchCerca = i.descrizione.toLowerCase().includes(cerca.toLowerCase())
    const matchCat   = !categoriaFiltro || i.categoria === categoriaFiltro
    return matchCerca && matchCat
  })

  const perCategoria = CATEGORIE.map(cat => ({
    ...cat,
    ingredienti: filtrati.filter(i => i.categoria === cat.id)
  })).filter(cat => cat.ingredienti.length > 0)

  const duplicato = isDuplicato(form.descrizione)

  return (
    <div className="p-6 h-full overflow-auto">
      <div style={{ maxWidth: '780px' }} className="mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingredienti default</h1>
            <p className="text-gray-500 text-sm mt-1">
              {tutti.length} ingredienti — clonati automaticamente per ogni nuova pizzeria
            </p>
          </div>
          <button onClick={apriNuovo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-sm">
            + Nuovo
          </button>
        </div>

        {/* Filtri categoria */}
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setCategoriaFiltro(null)}
            style={!categoriaFiltro ? { backgroundColor: '#1e40af', color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition">
            Tutti ({tutti.length})
          </button>
          {CATEGORIE.map(cat => {
            const count = tutti.filter(i => i.categoria === cat.id).length
            const attivo = categoriaFiltro === cat.id
            return (
              <button key={cat.id}
                onClick={() => setCategoriaFiltro(attivo ? null : cat.id)}
                style={attivo ? { backgroundColor: '#1e40af', color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition">
                {cat.emoji} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Cerca */}
        <div className="mb-5">
          <input type="text" placeholder="Cerca ingrediente..."
            value={cerca} onChange={e => setCerca(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>

        {/* Lista per categoria */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Caricamento...</div>
        ) : perCategoria.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Nessun ingrediente trovato</div>
        ) : (
          <div className="space-y-4">
            {perCategoria.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <h3 className="font-semibold text-gray-800 text-sm">{cat.label}</h3>
                  <span className="text-gray-400 text-xs ml-auto">{cat.ingredienti.length} ingredienti</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.ingredienti.map(ing => (
                    <div key={ing.id} className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition">
                      <IconaIngrediente url={ing.icona_url} />
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
                        <button onClick={() => apriModifica(ing)}
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
            ))}
          </div>
        )}
      </div>

      {/* MODAL CREA / MODIFICA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editId ? 'Modifica ingrediente' : 'Nuovo ingrediente'}
              </h3>
              <button onClick={chiudiModal}
                className="text-gray-400 hover:text-gray-600 transition text-xl font-light">
                ✕
              </button>
            </div>

            {/* Body modal — scrollabile */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {/* Icona upload */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="relative flex-shrink-0">
                  <img
                    src={iconaPreview || PLACEHOLDER}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-200"
                    alt="icona"
                  />
                  {iconaFile && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Icona ingrediente</p>
                  <p className="text-xs text-gray-400 mb-2">JPG, PNG, WebP — max 5MB — 200×200px</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 rounded-lg text-xs font-medium transition">
                    {iconaFile ? 'Cambia icona' : 'Carica icona'}
                  </button>
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleIconaChange} className="hidden" />
                </div>
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descrizione *</label>
                <input
                  value={form.descrizione}
                  onChange={e => { setForm(f => ({ ...f, descrizione: e.target.value })); if (errore) setErrore('') }}
                  placeholder="es: Mozzarella"
                  className={`${inputCls} ${duplicato ? 'border-red-400' : ''}`}
                />
                {duplicato && <p className="text-red-500 text-xs mt-1">⚠️ Nome già esistente</p>}
              </div>

              {/* Categoria + Prezzo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                  <select value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className={inputCls}>
                    {CATEGORIE.map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">€ extra</label>
                  <input type="text" inputMode="decimal" value={form.prezzo}
                    onChange={e => setForm(f => ({ ...f, prezzo: e.target.value.replace(/[^0-9,.]/, '') }))}
                    onBlur={e => {
                      const num = parseFloat(String(e.target.value).replace(',', '.'))
                      setForm(f => ({ ...f, prezzo: isNaN(num) ? '0' : String(Math.round(num * 100) / 100).replace('.', ',') }))
                    }}
                    placeholder="0,00" className={inputCls}
                  />
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nota (opzionale)</label>
                <input value={form.nota}
                  onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                  placeholder="es: biologico, DOP..." className={inputCls} />
              </div>

              {/* Allergeni */}
              <div>
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
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  <p className="text-red-600 text-sm">⚠️ {errore}</p>
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={chiudiModal}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition text-sm">
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
        </div>
      )}

      {/* Modal conferma eliminazione */}
      {confermaElimina && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="font-bold text-gray-900 text-center mb-2">Elimina ingrediente</h3>
            <p className="text-gray-500 text-sm text-center mb-1">Stai per eliminare definitivamente:</p>
            <p className="font-semibold text-gray-900 text-center mb-2">"{confermaElimina.descrizione}"</p>
            <p className="text-xs text-gray-400 text-center mb-5">Le pizzerie già create non saranno influenzate.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfermaElimina(null)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300 transition">
                Annulla
              </button>
              <button
                onClick={() => { const ingId = confermaElimina.id; setConfermaElimina(null); elimina.mutate(ingId) }}
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
