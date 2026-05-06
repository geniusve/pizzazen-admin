import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

export default function ListaPizzerie() {
  const [cerca, setCerca]         = useState('')
  const navigate                  = useNavigate()
  const queryClient               = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pizzerie', cerca],
    queryFn:  () => api.get(`/admin/pizzerie?cerca=${cerca}`),
  })

  const toggleAttiva = useMutation({
    mutationFn: ({ id, attiva }) =>
      attiva
        ? api.delete(`/admin/pizzerie/${id}`)
        : api.post(`/admin/pizzerie/${id}/attiva`),
    onSuccess: () => queryClient.invalidateQueries(['pizzerie']),
  })

  const pizzerie = data?.data?.pizzerie || []

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pizzerie</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.data?.totale || 0} pizzerie registrate
          </p>
        </div>
        <button
          onClick={() => navigate('/pizzerie/nuova')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200"
        >
          + Nuova pizzeria
        </button>
      </div>

      {/* Cerca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cerca per nome, città..."
          value={cerca}
          onChange={e => setCerca(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Caricamento...</div>
      ) : pizzerie.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🍕</p>
          <p className="text-gray-500 font-medium">Nessuna pizzeria trovata</p>
          <button
            onClick={() => navigate('/pizzerie/nuova')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
          >
            Crea la prima pizzeria
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {pizzerie.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6 hover:shadow-md transition"
            >
              {/* Logo */}
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                🍕
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-900 text-lg">{p.nome}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.attiva
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {p.attiva ? 'Attiva' : 'Disattiva'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">
                  {[p.citta, p.provincia].filter(Boolean).join(', ')}
                  {p.telefono && ` · ${p.telefono}`}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Slug: {p.slug} · {p.tipo_pizzeria || 'asporto'}
                </p>
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/pizzerie/${p.id}`)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                >
                  Modifica
                </button>
                <button
                  onClick={() => toggleAttiva.mutate({ id: p.id, attiva: p.attiva })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    p.attiva
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-green-50 hover:bg-green-100 text-green-600'
                  }`}
                >
                  {p.attiva ? 'Disattiva' : 'Riattiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
