export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Benvenuto nel pannello di amministrazione PizzaPax</p>
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Pizzerie attive', value: '—', icon: '🍕', color: 'bg-orange-50 text-orange-600' },
          { label: 'Ordini oggi', value: '—', icon: '📋', color: 'bg-blue-50 text-blue-600' },
          { label: 'Clienti totali', value: '—', icon: '👥', color: 'bg-green-50 text-green-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${card.color} mb-4`}>
              {card.icon}
            </div>
            <p className="text-3xl font-black text-gray-900">{card.value}</p>
            <p className="text-gray-500 text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
