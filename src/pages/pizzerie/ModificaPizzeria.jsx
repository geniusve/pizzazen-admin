import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm appearance-none"

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, children, colSpan }) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function CampoEuro({ value, onChange }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={String(value).replace('.', ',')}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9,.]/, '').replace(',', '.')
        onChange(raw)
      }}
      onBlur={e => {
        const num = parseFloat(String(e.target.value).replace(',', '.'))
        onChange(isNaN(num) ? 0 : Math.round(num * 100) / 100)
      }}
      className={inputCls}
    />
  )
}

export default function ModificaPizzeria() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm]       = useState(null)
  const [errore, setErrore]   = useState('')
  const [salvato, setSalvato] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['pizzeria', id],
    queryFn:  () => api.get(`/admin/pizzerie/${id}`),
  })

  useEffect(() => {
    if (data?.data) {
      const p = data.data
      setForm({
        nome:              p.nome || '',
        email:             p.email || '',
        telefono:          p.telefono || '',
        cellulare:         p.cellulare || '',
        via:               p.via || '',
        numero_civico:     p.numero_civico || '',
        cap:               p.cap || '',
        citta:             p.citta || '',
        provincia:         p.provincia || '',
        nome_titolare:     p.nome_titolare || '',
        telefono_titolare: p.telefono_titolare || '',
        tipo_pizzeria:     p.tipo_pizzeria || 'asporto',
        slot_minuti:       p.slot_minuti || 10,
        slot_max_pizze:    p.slot_max_pizze || 8,
        delivery_attivo:   p.delivery_attivo || false,
        delivery_costo_tipo: p.delivery_costo_tipo || 'per_ordine',
        delivery_costo:    p.delivery_costo || 0,
        descrizione:       p.descrizione || '',
        commissione_percentuale: p.commissione_percentuale || 1.00,
        commissione_fissa:       p.commissione_fissa || 0.00,
        commissione_mensile:     p.commissione_mensile || 0.00,
      })
    }
  }, [data])

  const aggiorna = useMutation({
    mutationFn: () => api.put(`/admin/pizzerie/${id}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries(['pizzerie'])
      queryClient.invalidateQueries(['pizzeria', id])
      setSalvato(true)
      setTimeout(() => setSalvato(false), 3000)
    },
    onError: (err) => setErrore(err?.messaggio || 'Errore nel salvataggio'),
  })

  const set = (campo, valore) => setForm(f => ({ ...f, [campo]: valore }))

  if (isLoading || !form) return (
    <div className="p-8 flex items-center justify-center">
      <p className="text-gray-400">Caricamento...</p>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate('/pizzerie')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Torna alla lista
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data?.data?.nome}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Slug: <span className="font-mono text-blue-600">{data?.data?.slug}</span>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${data?.data?.attiva ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {data?.data?.attiva ? 'Attiva' : 'Disattiva'}
          </span>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); setErrore(''); aggiorna.mutate() }} className="space-y-6">

        <Section title="Dati pizzeria" icon="🍕">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome pizzeria *" colSpan={2}>
              <input value={form.nome} onChange={e => set('nome', e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Descrizione" colSpan={2}>
              <textarea value={form.descrizione} onChange={e => set('descrizione', e.target.value)}
                rows={2} placeholder="Descrizione breve..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm resize-none" />
            </Field>
            <Field label="Tipo">
              <select value={form.tipo_pizzeria} onChange={e => set('tipo_pizzeria', e.target.value)} className={inputCls}>
                <option value="asporto">Solo asporto</option>
                <option value="asporto_delivery">Asporto + Delivery</option>
                <option value="ristorante">Ristorante</option>
              </select>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Telefono">
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Cellulare">
              <input value={form.cellulare} onChange={e => set('cellulare', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Indirizzo" icon="📍">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Via" colSpan={2}>
              <input value={form.via} onChange={e => set('via', e.target.value)} className={inputCls} />
            </Field>
            <Field label="N. civico">
              <input value={form.numero_civico} onChange={e => set('numero_civico', e.target.value)} className={inputCls} />
            </Field>
            <Field label="CAP">
              <input value={form.cap} onChange={e => set('cap', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Città">
              <input value={form.citta} onChange={e => set('citta', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Provincia">
              <input value={form.provincia} onChange={e => set('provincia', e.target.value)} maxLength={2} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Titolare" icon="👤">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome titolare">
              <input value={form.nome_titolare} onChange={e => set('nome_titolare', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Telefono titolare">
              <input value={form.telefono_titolare} onChange={e => set('telefono_titolare', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Commissioni" icon="💰">
          <p className="text-gray-500 text-sm mb-4">
            Commissioni applicate a questa pizzeria per l'utilizzo del servizio
          </p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Commissione %">
              <div className="relative">
                <CampoEuro
                  value={form.commissione_percentuale}
                  onChange={v => set('commissione_percentuale', v)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
              </div>
            </Field>
            <Field label="Commissione fissa">
              <div className="relative">
                <CampoEuro
                  value={form.commissione_fissa}
                  onChange={v => set('commissione_fissa', v)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">€</span>
              </div>
            </Field>
            <Field label="Commissione mensile">
              <div className="relative">
                <CampoEuro
                  value={form.commissione_mensile}
                  onChange={v => set('commissione_mensile', v)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">€/mese</span>
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Slot ordini" icon="⏰">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durata slot">
              <select value={form.slot_minuti} onChange={e => set('slot_minuti', parseInt(e.target.value))} className={inputCls}>
                {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v} minuti</option>)}
              </select>
            </Field>
            <Field label="Max pizze per slot">
              <input type="number" min="1" max="50" value={form.slot_max_pizze}
                onChange={e => set('slot_max_pizze', parseInt(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Delivery" icon="🛵">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set('delivery_attivo', !form.delivery_attivo)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 cursor-pointer ${form.delivery_attivo ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.delivery_attivo ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="font-medium text-gray-700">Consegna a domicilio attiva</span>
            </label>
            {form.delivery_attivo && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <Field label="Tipo costo">
                  <select value={form.delivery_costo_tipo} onChange={e => set('delivery_costo_tipo', e.target.value)} className={inputCls}>
                    <option value="per_ordine">Fisso per ordine</option>
                    <option value="per_pizza">Per pizza ordinata</option>
                  </select>
                </Field>
                <Field label="Costo (€)">
                  <CampoEuro value={form.delivery_costo} onChange={v => set('delivery_costo', v)} />
                </Field>
              </div>
            )}
          </div>
        </Section>

        {errore && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-medium">⚠️ {errore}</p>
          </div>
        )}
        {salvato && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-600 text-sm font-medium">✅ Modifiche salvate!</p>
          </div>
        )}

        <div className="flex gap-3 pt-2 pb-8">
          <button type="button" onClick={() => navigate('/pizzerie')}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition">
            Annulla
          </button>
          <button type="submit" disabled={aggiorna.isPending}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200">
            {aggiorna.isPending ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </form>
    </div>
  )
}
