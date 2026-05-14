import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Utilities ───────────────────────────────────────────────

function formatData(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ nome, cognome, size = 40 }) {
  const initials = [nome, cognome].filter(Boolean).map(s => s[0].toUpperCase()).join('').slice(0, 2) || '?'
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-500',
  ]
  const color = colors[(nome?.charCodeAt(0) || 0) % colors.length]
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

// ─── Prefissi telefonici ─────────────────────────────────────

const PREFISSI = [
  { code: '+39',  flag: '🇮🇹', paese: 'Italia' },
  { code: '+43',  flag: '🇦🇹', paese: 'Austria' },
  { code: '+32',  flag: '🇧🇪', paese: 'Belgio' },
  { code: '+359', flag: '🇧🇬', paese: 'Bulgaria' },
  { code: '+357', flag: '🇨🇾', paese: 'Cipro' },
  { code: '+385', flag: '🇭🇷', paese: 'Croazia' },
  { code: '+45',  flag: '🇩🇰', paese: 'Danimarca' },
  { code: '+372', flag: '🇪🇪', paese: 'Estonia' },
  { code: '+358', flag: '🇫🇮', paese: 'Finlandia' },
  { code: '+33',  flag: '🇫🇷', paese: 'Francia' },
  { code: '+49',  flag: '🇩🇪', paese: 'Germania' },
  { code: '+30',  flag: '🇬🇷', paese: 'Grecia' },
  { code: '+353', flag: '🇮🇪', paese: 'Irlanda' },
  { code: '+371', flag: '🇱🇻', paese: 'Lettonia' },
  { code: '+370', flag: '🇱🇹', paese: 'Lituania' },
  { code: '+352', flag: '🇱🇺', paese: 'Lussemburgo' },
  { code: '+356', flag: '🇲🇹', paese: 'Malta' },
  { code: '+31',  flag: '🇳🇱', paese: 'Olanda' },
  { code: '+48',  flag: '🇵🇱', paese: 'Polonia' },
  { code: '+351', flag: '🇵🇹', paese: 'Portogallo' },
  { code: '+420', flag: '🇨🇿', paese: 'Repubblica Ceca' },
  { code: '+40',  flag: '🇷🇴', paese: 'Romania' },
  { code: '+421', flag: '🇸🇰', paese: 'Slovacchia' },
  { code: '+386', flag: '🇸🇮', paese: 'Slovenia' },
  { code: '+34',  flag: '🇪🇸', paese: 'Spagna' },
  { code: '+46',  flag: '🇸🇪', paese: 'Svezia' },
  { code: '+36',  flag: '🇭🇺', paese: 'Ungheria' },
]

function parsePhone(value) {
  if (!value) return { prefisso: '+39', numero: '' }
  const clean  = value.replace(/\s/g, '')
  const sorted = [...PREFISSI].sort((a, b) => b.code.length - a.code.length)
  const found  = sorted.find(p => clean.startsWith(p.code))
  if (found) return { prefisso: found.code, numero: clean.slice(found.code.length) }
  return { prefisso: '+39', numero: value.trim() }
}

// ─── Campo form ──────────────────────────────────────────────

function Campo({ label, value, onChange, type = 'text', placeholder, required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-900"
      />
    </div>
  )
}

function CampoTelefono({ label, value, onChange, required }) {
  const { prefisso: initPref, numero: initNum } = parsePhone(value)
  const [prefisso, setPrefisso] = useState(initPref)
  const [numero, setNumero]     = useState(initNum)
  const [aperto, setAperto]     = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAperto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const aggiorna = (pref, num) => onChange(num.trim() ? `${pref} ${num.trim()}` : '')
  const prefInfo = PREFISSI.find(p => p.code === prefisso) || PREFISSI[0]

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2" ref={ref}>
        <div className="relative">
          <button type="button" onClick={() => setAperto(a => !a)}
            className="h-9 px-2.5 border border-gray-200 rounded-xl bg-white text-sm flex items-center gap-1.5 hover:bg-gray-50 transition whitespace-nowrap">
            <span className="text-base leading-none">{prefInfo.flag}</span>
            <span className="text-gray-700 font-semibold">{prefInfo.code}</span>
            <span className="text-gray-400 text-xs">▾</span>
          </button>
          {aperto && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto w-52">
              {PREFISSI.map(p => (
                <button key={p.code} type="button"
                  onClick={() => { setPrefisso(p.code); aggiorna(p.code, numero); setAperto(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${prefisso === p.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span>{p.flag}</span>
                  <span className="font-semibold w-10 flex-shrink-0">{p.code}</span>
                  <span className="text-gray-400 text-xs truncate">{p.paese}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input type="tel" value={numero}
          onChange={e => { setNumero(e.target.value); aggiorna(prefisso, e.target.value) }}
          placeholder="333 1234567"
          className="flex-1 h-9 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-900"
        />
      </div>
    </div>
  )
}

// ─── Modal crea/modifica ─────────────────────────────────────

function ModalCliente({ cliente, onClose, onSaved }) {
  const queryClient = useQueryClient()
  const isEdit = !!cliente

  const [form, setForm] = useState({
    nome:           cliente?.nome           || '',
    cognome:        cliente?.cognome        || '',
    cellulare:      cliente?.cellulare      || '',
    telefono:       cliente?.telefono       || '',
    email:          cliente?.email          || '',
    via:            cliente?.via            || '',
    numero_civico:  cliente?.numero_civico  || '',
    cap:            cliente?.cap            || '',
    citta:          cliente?.citta          || '',
    provincia:      cliente?.provincia      || '',
    note:           cliente?.note           || '',
    whatsapp_abilitato: cliente?.whatsapp_abilitato ?? true,
  })
  const [errore, setErrore]     = useState('')
  const [duplicato, setDuplicato] = useState(null) // null | { nome, cognome, cellulare }

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }))

  // Controllo duplicati cellulare (solo in creazione, debounced 600ms)
  useEffect(() => {
    if (isEdit) return
    const cel = form.cellulare?.replace(/\s/g, '')
    if (!cel || cel.length < 6) { setDuplicato(null); return }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/admin/clienti/lookup', { cellulare: cel })
        setDuplicato(res.data?.trovato ? res.data.cliente : null)
      } catch { setDuplicato(null) }
    }, 600)
    return () => clearTimeout(timer)
  }, [form.cellulare, isEdit])

  const salva = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/admin/clienti/${cliente.id}`, data)
      : api.post('/admin/clienti', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-clienti'] })
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['admin-cliente', cliente.id] })
      onSaved(res.data)
    },
    onError: (err) => {
      setErrore(err.response?.data?.messaggio || 'Errore durante il salvataggio')
    },
  })

  const submit = () => {
    setErrore('')
    if (!form.nome?.trim())      { setErrore('Il nome è obbligatorio'); return }
    if (!form.cellulare?.trim()) { setErrore('Il cellulare è obbligatorio'); return }
    if (duplicato)               { setErrore('Numero già in uso, impossibile procedere'); return }
    salva.mutate({ ...form, provincia: form.provincia.toUpperCase().slice(0, 2) || undefined })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Modifica cliente' : 'Nuovo cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none transition">✕</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nome" value={form.nome} onChange={set('nome')} placeholder="Mario" required />
            <Campo label="Cognome" value={form.cognome} onChange={set('cognome')} placeholder="Rossi" />
          </div>

          <CampoTelefono label="Cellulare" value={form.cellulare} onChange={set('cellulare')} required />
          {duplicato && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
              <span className="text-base flex-shrink-0 mt-0.5">⛔</span>
              <div>
                <span className="font-semibold">Numero già registrato</span>
                <span className="text-red-500"> — {[duplicato.nome, duplicato.cognome].filter(Boolean).join(' ') || 'cliente esistente'}</span>
              </div>
            </div>
          )}
          <CampoTelefono label="Telefono fisso" value={form.telefono} onChange={set('telefono')} />
          <Campo label="Email" value={form.email} onChange={set('email')} type="email" placeholder="mario@email.it" />

          <div className="grid grid-cols-[1fr_80px_90px] gap-2">
            <Campo label="Via / Strada" value={form.via} onChange={set('via')} placeholder="Via Roma" />
            <Campo label="N° civico" value={form.numero_civico} onChange={set('numero_civico')} placeholder="1" />
            <Campo label="CAP" value={form.cap} onChange={set('cap')} placeholder="00100" />
          </div>

          <div className="grid grid-cols-[1fr_80px] gap-2">
            <Campo label="Città" value={form.citta} onChange={set('citta')} placeholder="Roma" />
            <Campo label="Provincia" value={form.provincia} onChange={val => set('provincia')(val.toUpperCase().slice(0, 2))} placeholder="RM" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</label>
            <textarea
              value={form.note}
              onChange={e => set('note')(e.target.value)}
              placeholder="Note interne sul cliente..."
              rows={2}
              className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-900 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('whatsapp_abilitato')(!form.whatsapp_abilitato)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.whatsapp_abilitato ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.whatsapp_abilitato ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">WhatsApp abilitato</span>
          </label>

          {errore && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">{errore}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">
            Annulla
          </button>
          <button onClick={submit} disabled={salva.isPending || !!duplicato}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
            {salva.isPending ? 'Salvataggio...' : isEdit ? 'Salva modifiche' : 'Crea cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sezione ordini pizzeria (con load more) ──────────────────

function OrdiniPizzeria({ clienteId, pizzeria }) {
  const [pagina, setPagina]               = useState(1)
  const [ordiniAccumulati, setOrdiniAccumulati] = useState([])

  const { data, isFetching } = useQuery({
    queryKey: ['admin-clienti-ordini', clienteId, pizzeria.id, pagina],
    queryFn:  () => api.get(`/admin/clienti/${clienteId}/ordini`, {
      params: { pizzeria_id: pizzeria.id, pagina },
    }),
  })

  useEffect(() => {
    const nuovi = data?.data?.ordini || []
    if (!nuovi.length) return
    setOrdiniAccumulati(prev => pagina === 1 ? nuovi : [...prev, ...nuovi])
  }, [data])

  const totPagine = data?.data?.pagine || 1
  const haAltri   = pagina < totPagine
  const ordini    = ordiniAccumulati

  const STATI = {
    completato:  'bg-green-100 text-green-700',
    in_corso:    'bg-blue-100 text-blue-700',
    confermato:  'bg-yellow-100 text-yellow-700',
    in_attesa:   'bg-orange-100 text-orange-700',
    annullato:   'bg-red-100 text-red-700',
  }

  const TIPI = {
    asporto:  '🥡 Asporto',
    delivery: '🛵 Delivery',
    tavolo:   '🍽️ Tavolo',
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-800 text-sm">{pizzeria.nome}</span>
          <span className="text-gray-400 text-xs ml-2">· slug: {pizzeria.slug}</span>
        </div>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {pizzeria.totale_ordini} ordini
        </span>
      </div>

      {ordini.length === 0 && !isFetching ? (
        <div className="px-4 py-4 text-sm text-gray-400 text-center">Nessun ordine</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {ordini.map(o => (
            <div key={o.id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">#{o.numero_ordine}</div>
                <div className="text-xs text-gray-400">{formatData(o.created_at)} · {TIPI[o.tipo_ordine] || o.tipo_ordine}</div>
              </div>
              <span className="text-sm font-bold text-gray-900">€{parseFloat(o.totale || 0).toFixed(2)}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATI[o.stato] || 'bg-gray-100 text-gray-600'}`}>
                {o.stato?.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {haAltri && (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <button
            onClick={() => setPagina(p => p + 1)}
            disabled={isFetching}
            className="text-sm text-blue-600 font-semibold hover:underline disabled:opacity-50"
          >
            {isFetching ? 'Caricamento...' : 'Carica altri 10 ordini'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pannello dettaglio ──────────────────────────────────────

function PannelloDettaglio({ clienteId, onModifica }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-cliente', clienteId],
    queryFn:  () => api.get(`/admin/clienti/${clienteId}`),
    enabled:  !!clienteId,
  })
  const c = data?.data

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Caricamento...</div>
  }
  if (!c) return null

  const nomeCompleto = [c.nome, c.cognome].filter(Boolean).join(' ') || 'Senza nome'
  const indirizzo = [c.via, c.numero_civico].filter(Boolean).join(' ')
  const localita  = [c.cap, c.citta, c.provincia].filter(Boolean).join(' ')
  const waLink = c.whatsapp_abilitato && c.cellulare
    ? `https://wa.me/${c.cellulare.replace(/\D/g, '')}`
    : null

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <Avatar nome={c.nome} cognome={c.cognome} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{nomeCompleto}</h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
                {c.totale_ordini || 0} ordini
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Cliente dal {formatData(c.data_primo_ordine)}
              {c.tipo_inserimento && ` · ${c.tipo_inserimento}`}
            </p>
          </div>
          <button onClick={onModifica}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition flex-shrink-0">
            Modifica
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informazioni</h3>
        <div className="space-y-2.5">
          <RigaInfo icon="📱" label="Cellulare" value={c.cellulare} />
          {c.telefono && <RigaInfo icon="☎️" label="Telefono" value={c.telefono} />}
          {c.email    && <RigaInfo icon="✉️"  label="Email"    value={c.email} />}
          {(indirizzo || localita) && (
            <RigaInfo icon="📍" label="Indirizzo" value={[indirizzo, localita].filter(Boolean).join(', ')} />
          )}
          {c.note && <RigaInfo icon="📝" label="Note" value={c.note} />}
          <div className="flex items-start gap-3">
            <span className="text-base w-5 flex-shrink-0">#️⃣</span>
            <div>
              <div className="text-xs text-gray-400 font-medium mb-0.5">Codice cliente</div>
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded-lg text-gray-800 font-bold tracking-widest">
                {c.codice_cliente}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Azioni */}
      {waLink && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Azioni</h3>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl text-sm transition border border-green-200"
          >
            <span>💬</span>
            Manda link WhatsApp
          </a>
        </div>
      )}

      {/* Storico ordini per pizzeria */}
      <div className="px-6 py-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Storico ordini per pizzeria
        </h3>
        {c.pizzerie?.length === 0 ? (
          <p className="text-sm text-gray-400">Nessun ordine ancora</p>
        ) : (
          <div className="space-y-4">
            {c.pizzerie?.map(p => (
              <OrdiniPizzeria key={p.id} clienteId={c.id} pizzeria={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RigaInfo({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base w-5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
        <div className="text-sm text-gray-800 font-medium">{value}</div>
      </div>
    </div>
  )
}

// ─── Pagina principale ────────────────────────────────────────

export default function ListaClienti() {
  const [cerca, setCerca]           = useState('')
  const [pagina, setPagina]         = useState(1)
  const [clienteSel, setClienteSel] = useState(null)
  const [showModal, setShowModal]   = useState(false)
  const [modalCliente, setModalCliente] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-clienti', cerca, pagina],
    queryFn:  () => api.get('/admin/clienti', { params: { cerca: cerca || undefined, pagina } }),
    keepPreviousData: true,
  })

  const lista   = data?.data?.clienti || []
  const totPagine = data?.data?.pagine || 1
  const totale  = data?.data?.totale  || 0

  const apriNuovo = () => { setModalCliente(null); setShowModal(true) }
  const apriModifica = () => { setModalCliente(clienteSel); setShowModal(true) }

  const handleCerca = (v) => { setCerca(v); setPagina(1); setClienteSel(null) }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Sinistra: lista ── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Clienti</h1>
              <p className="text-xs text-gray-400 mt-0.5">{totale} registrati</p>
            </div>
            <button onClick={apriNuovo}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition shadow shadow-blue-200">
              + Nuovo
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={cerca}
              onChange={e => handleCerca(e.target.value)}
              placeholder="Nome, cognome, cellulare..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-900"
            />
          </div>
        </div>

        {/* Lista card */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Caricamento...</div>
          ) : lista.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm text-gray-500 font-medium">{cerca ? 'Nessun risultato' : 'Nessun cliente'}</p>
            </div>
          ) : (
            lista.map(c => {
              const nome = [c.nome, c.cognome].filter(Boolean).join(' ') || 'Senza nome'
              const isSelected = clienteSel?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setClienteSel(c)}
                  className={`px-4 py-3.5 cursor-pointer border-b border-gray-50 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar nome={c.nome} cognome={c.cognome} size={38} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                        {nome}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{c.cellulare}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 ml-[50px]">
                    <span className="text-xs text-gray-400">
                      📅 {formatData(c.data_primo_ordine)}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      {c.totale_ordini} ordini
                    </span>
                    <span className="text-xs text-violet-500">
                      {c.num_pizzerie} 🍕
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Paginazione */}
        {totPagine > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30 transition">
              ← Prec
            </button>
            <span className="text-xs text-gray-400">{pagina} / {totPagine}</span>
            <button onClick={() => setPagina(p => Math.min(totPagine, p + 1))} disabled={pagina === totPagine}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-30 transition">
              Succ →
            </button>
          </div>
        )}
      </div>

      {/* ── Destra: dettaglio ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {clienteSel ? (
          <PannelloDettaglio clienteId={clienteSel.id} onModifica={apriModifica} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <span className="text-5xl">👤</span>
            <p className="text-sm font-medium text-gray-500">Seleziona un cliente</p>
            <p className="text-xs text-gray-400">Il dettaglio apparirà qui</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalCliente
          cliente={modalCliente}
          onClose={() => setShowModal(false)}
          onSaved={(saved) => {
            setShowModal(false)
            if (!modalCliente) setClienteSel(saved)
          }}
        />
      )}
    </div>
  )
}
