import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
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

export default function NuovaPizzeria() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '', email: '', telefono: '', cellulare: '',
    via: '', numero_civico: '', cap: '', citta: '', provincia: '',
    nome_titolare: '', telefono_titolare: '',
    tipo_pizzeria: 'asporto',
    slot_minuti: 10, slot_max_pizze: 8,
    delivery_attivo: false, delivery_costo_tipo: 'per_ordine', delivery_costo: 0,
    admin_username: '', admin_password: '', admin_nome: '',
  })
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState(null)

  const crea = useMutation({
    mutationFn: () => api.post('/admin/pizzerie', form),
    onSuccess: (res) => setSuccesso(res.data),
    onError: (err) => setErrore(err?.messaggio || 'Errore nella creazione'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrore('')
    crea.mutate()
  }

  const set = (campo, valore) => setForm(f => ({ ...f, [campo]: valore }))

  if (successo) return (
    <div className="p-8 max-w-lg mx-auto text-center">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Pizzeria creata!</h2>
        <p className="text-gray-500 mb-6">Tutto configurato e pronto all'uso</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Nome</span>
            <span className="font-semibold text-gray-900 text-sm">{successo.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Slug</span>
            <span className="font-mono text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded">{successo.slug}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Admin username</span>
            <span className="font-semibold text-gray-900 text-sm">{successo.admin_username}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pizzerie')}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition"
          >
            Lista pizzerie
          </button>
          <button
            onClick={() => {
              setSuccesso(null)
              setForm(f => ({ ...f, nome: '', admin_username: '', admin_password: '', admin_nome: '' }))
            }}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Crea un'altra
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header migliorato */}
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
        <h1 className="text-2xl font-bold text-gray-900">Nuova pizzeria</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compila i dati per registrare una nuova pizzeria nel sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dati pizzeria */}
        <Section title="Dati pizzeria" icon="🍕">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome pizzeria *" colSpan={2}>
              <input value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="Pizzeria Da Mario" required className={inputCls} />
            </Field>
            <Field label="Tipo">
              <select value={form.tipo_pizzeria} onChange={e => set('tipo_pizzeria', e.target.value)} className={inputCls}>
                <option value="asporto">Solo asporto</option>
                <option value="asporto_delivery">Asporto + Delivery</option>
                <option value="ristorante">Ristorante</option>
              </select>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="info@pizzeria.it" className={inputCls} />
            </Field>
            <Field label="Telefono">
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="045 123456" className={inputCls} />
            </Field>
            <Field label="Cellulare">
              <input value={form.cellulare} onChange={e => set('cellulare', e.target.value)}
                placeholder="347 1234567" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Indirizzo */}
        <Section title="Indirizzo" icon="📍">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Via" colSpan={2}>
              <input value={form.via} onChange={e => set('via', e.target.value)}
                placeholder="Via Roma" className={inputCls} />
            </Field>
            <Field label="N. civico">
              <input value={form.numero_civico} onChange={e => set('numero_civico', e.target.value)}
                placeholder="12" className={inputCls} />
            </Field>
            <Field label="CAP">
              <input value={form.cap} onChange={e => set('cap', e.target.value)}
                placeholder="37100" className={inputCls} />
            </Field>
            <Field label="Città">
              <input value={form.citta} onChange={e => set('citta', e.target.value)}
                placeholder="Verona" className={inputCls} />
            </Field>
            <Field label="Provincia">
              <input value={form.provincia} onChange={e => set('provincia', e.target.value)}
                placeholder="VR" maxLength={2} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Titolare */}
        <Section title="Titolare" icon="👤">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome titolare">
              <input value={form.nome_titolare} onChange={e => set('nome_titolare', e.target.value)}
                placeholder="Mario Rossi" className={inputCls} />
            </Field>
            <Field label="Telefono titolare">
              <input value={form.telefono_titolare} onChange={e => set('telefono_titolare', e.target.value)}
                placeholder="347 1234567" className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Slot */}
        <Section title="Slot ordini" icon="⏰">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durata slot">
              <select value={form.slot_minuti} onChange={e => set('slot_minuti', parseInt(e.target.value))} className={inputCls}>
                {[5, 10, 15, 20, 30].map(v => (
                  <option key={v} value={v}>{v} minuti</option>
                ))}
              </select>
            </Field>
            <Field label="Max pizze per slot">
              <input type="number" min="1" max="50" value={form.slot_max_pizze}
                onChange={e => set('slot_max_pizze', parseInt(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Delivery */}
        <Section title="Delivery" icon="🛵">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set('delivery_attivo', !form.delivery_attivo)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 cursor-pointer ${
                  form.delivery_attivo ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.delivery_attivo ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className="font-medium text-gray-700">Abilita consegna a domicilio</span>
            </label>

            {form.delivery_attivo && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <Field label="Tipo costo">
                  <select value={form.delivery_costo_tipo}
                    onChange={e => set('delivery_costo_tipo', e.target.value)} className={inputCls}>
                    <option value="per_ordine">Fisso per ordine</option>
                    <option value="per_pizza">Per pizza ordinata</option>
                  </select>
                </Field>
                <Field label="Costo (€)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={String(form.delivery_costo).replace('.', ',')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9,.]/, '').replace(',', '.')
                      set('delivery_costo', raw)
                    }}
                    onBlur={e => {
                      const num = parseFloat(String(e.target.value).replace(',', '.'))
                      set('delivery_costo', isNaN(num) ? 0 : Math.round(num * 100) / 100)
                    }}
                    placeholder="es: 3,00"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </div>
        </Section>

        {/* Account admin */}
        <Section title="Account admin pizzeria" icon="🔑">
          <p className="text-gray-500 text-sm mb-4">
            Credenziali che il titolare userà per accedere al pannello
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome completo" colSpan={2}>
              <input value={form.admin_nome} onChange={e => set('admin_nome', e.target.value)}
                placeholder="Mario Rossi" className={inputCls} />
            </Field>
            <Field label="Username *">
              <input value={form.admin_username} onChange={e => set('admin_username', e.target.value)}
                placeholder="mario" required className={inputCls} />
            </Field>
            <Field label="Password *">
              <input type="password" value={form.admin_password}
                onChange={e => set('admin_password', e.target.value)}
                placeholder="min 6 caratteri" required minLength={6} className={inputCls} />
            </Field>
          </div>
        </Section>

        {errore && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm font-medium">⚠️ {errore}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2 pb-8">
          <button
            type="button"
            onClick={() => navigate('/pizzerie')}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={crea.isPending}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200"
          >
            {crea.isPending ? 'Creazione in corso...' : 'Crea pizzeria'}
          </button>
        </div>

      </form>
    </div>
  )
}
