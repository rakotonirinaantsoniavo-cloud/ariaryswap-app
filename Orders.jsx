import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const statusStyle = {
  pending: 'bg-vanilla/15 text-vanillaLight',
  approved: 'bg-emerald/15 text-emeraldLight',
  completed: 'bg-emerald/15 text-emeraldLight',
  rejected: 'bg-dangerRed/15 text-dangerRed',
}
const statusLabel = { pending: 'En attente', approved: 'Approuvé', completed: 'Terminé', rejected: 'Refusé' }

export default function Orders() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('orders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [profile])

  return (
    <div className="flex h-screen bg-bgPrimary text-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Mes ordres" subtitle="Historique de vos transactions" />
        <div className="flex-1 overflow-y-auto px-8 py-6 page-anim">
          <div className="bg-bgCard border border-borderC rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-textSecondary text-[11px] uppercase bg-white/[0.02] border-b border-borderC">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Paire</th>
                  <th className="px-4 py-3">Montant crypto</th>
                  <th className="px-4 py-3">Ariary</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-white/[0.03] last:border-none hover:bg-bgCardHover">
                    <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-body">{o.type === 'buy' ? 'Achat' : 'Vente'}</td>
                    <td className="px-4 py-3">{o.pair}</td>
                    <td className="px-4 py-3">{o.crypto_amount}</td>
                    <td className="px-4 py-3">{Number(o.ariary_amount).toLocaleString('fr-FR')} Ar</td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-[11px] font-bold px-3 py-1 rounded-full ${statusStyle[o.status]}`}>
                        {statusLabel[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-textMuted font-body">Aucun ordre pour le moment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
