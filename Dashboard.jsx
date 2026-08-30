import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Dashboard() {
  const { profile } = useAuth()
  const [rates, setRates] = useState([])
  const [orderCount, setOrderCount] = useState(0)
  const [walletCount, setWalletCount] = useState(0)

  useEffect(() => {
    supabase.from('exchange_rates').select('*').order('pair').then(({ data }) => setRates(data || []))
    if (profile?.id) {
      supabase.from('orders').select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id).eq('status', 'pending')
        .then(({ count }) => setOrderCount(count || 0))
      supabase.from('wallets').select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .then(({ count }) => setWalletCount(count || 0))
    }
  }, [profile])

  const kycLabel = {
    pending: 'À soumettre',
    submitted: 'En attente',
    approved: 'Vérifié',
    rejected: 'Refusé',
  }[profile?.kyc_status] || 'À soumettre'

  return (
    <div className="flex h-screen bg-bgPrimary text-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={`Bonjour, ${profile?.full_name || 'client'}`} subtitle="Voici votre aperçu du marché" />
        <div className="flex-1 overflow-y-auto px-8 py-6 page-anim">
          <div className="text-[11px] font-mono uppercase tracking-widest text-emeraldLight mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-emeraldLight"></span> Tableau de bord
          </div>

          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard icon="fa-arrow-right-arrow-left" label="Ordres en attente" value={orderCount} />
            <StatCard icon="fa-shield-halved" label="Statut KYC" value={kycLabel} />
            <StatCard icon="fa-wallet" label="Wallets enregistrés" value={walletCount} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Marché Ariary ⇄ Crypto</h3>
            <span className="bg-emerald/15 text-emeraldLight text-[11px] font-mono font-bold px-3.5 py-1 rounded-full">Taux fixés par l'admin</span>
          </div>

          <div className="bg-bgCard border border-borderC rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-textSecondary text-[11px] uppercase bg-white/[0.02] border-b border-borderC">
                  <th className="px-4 py-3">Paire</th>
                  <th className="px-4 py-3">Taux (Ar)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {rates.map(r => (
                  <tr key={r.id} className="border-b border-white/[0.03] last:border-none hover:bg-bgCardHover">
                    <td className="px-4 py-3 font-body font-semibold">{r.pair}</td>
                    <td className="px-4 py-3">{Number(r.rate).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/exchange" className="bg-gradient-to-br from-[#c98a2a] to-[#f0cf7f] text-[#14150f] font-body font-bold text-xs px-4 py-1.5 rounded-full">
                        Échanger
                      </Link>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-textMuted font-body">Aucun taux défini pour le moment.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-bgCard border border-borderC rounded-card p-5 hover:border-vanilla transition-colors">
      <div className="w-9 h-9 rounded-lg bg-vanilla/15 text-vanillaLight flex items-center justify-center mb-3.5">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="text-[11.5px] uppercase tracking-wide text-textSecondary font-semibold mb-1.5">{label}</div>
      <div className="font-mono text-[22px] font-semibold">{value}</div>
    </div>
  )
}
