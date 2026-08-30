import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Admin() {
  const { profile } = useAuth()
  const [userCount, setUserCount] = useState(0)
  const [pendingKyc, setPendingKyc] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [rates, setRates] = useState([])
  const [rateEdits, setRateEdits] = useState({})
  const [notifText, setNotifText] = useState('')
  const [notifMsg, setNotifMsg] = useState(null)

  async function loadAll() {
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    setUserCount(count || 0)

    const { data: kyc } = await supabase.from('profiles').select('*').eq('kyc_status', 'submitted')
    setPendingKyc(kyc || [])

    const { data: orders } = await supabase.from('orders').select('*, profiles(email)').eq('status', 'pending').order('created_at')
    setPendingOrders(orders || [])

    const { data: r } = await supabase.from('exchange_rates').select('*').order('pair')
    setRates(r || [])
  }

  useEffect(() => { loadAll() }, [])

  async function approveKyc(userId, approve) {
    await supabase.from('profiles').update({ kyc_status: approve ? 'approved' : 'rejected' }).eq('id', userId)
    loadAll()
  }

  async function decideOrder(orderId, approve) {
    await supabase.from('orders').update({ status: approve ? 'approved' : 'rejected' }).eq('id', orderId)
    loadAll()
  }

  async function updateRate(rateId, pair) {
    const newRate = rateEdits[rateId]
    if (!newRate) return
    await supabase.from('exchange_rates').update({ rate: Number(newRate), updated_by: profile.id, updated_at: new Date().toISOString() }).eq('id', rateId)
    loadAll()
  }

  async function sendNotification(e) {
    e.preventDefault()
    setNotifMsg(null)
    const { error } = await supabase.from('notifications').insert({ user_id: null, title: 'Mise à jour AriarySwap', message: notifText })
    if (error) setNotifMsg({ type: 'error', text: error.message })
    else { setNotifMsg({ type: 'success', text: 'Notification envoyée à tous les utilisateurs.' }); setNotifText('') }
  }

  const inputClass = "px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 outline-none focus:border-vanilla"

  return (
    <div className="flex h-screen bg-bgPrimary text-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Espace administrateur" subtitle="Gestion de la plateforme" />
        <div className="flex-1 overflow-y-auto px-8 py-6 page-anim">

          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard icon="fa-users" label="Utilisateurs inscrits" value={userCount} />
            <StatCard icon="fa-id-card" label="KYC en attente" value={pendingKyc.length} />
            <StatCard icon="fa-receipt" label="Ordres en attente" value={pendingOrders.length} />
          </div>

          <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="bg-bgCard border border-borderC rounded-card p-6">
              <h3 className="font-display text-base font-semibold mb-4">Taux de change</h3>
              {rates.map(r => (
                <div key={r.id} className="flex items-center gap-2 mb-2.5">
                  <span className="w-24 font-mono text-sm text-textSecondary">{r.pair}</span>
                  <input
                    type="number" className={inputClass} placeholder={r.rate}
                    onChange={e => setRateEdits({ ...rateEdits, [r.id]: e.target.value })}
                  />
                  <button onClick={() => updateRate(r.id, r.pair)} className="px-4 py-2 rounded-sm2 bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary font-bold text-xs">OK</button>
                </div>
              ))}
            </div>

            <div className="bg-bgCard border border-borderC rounded-card p-6">
              <h3 className="font-display text-base font-semibold mb-4">Notifier les utilisateurs</h3>
              <form onSubmit={sendNotification} className="flex flex-col gap-3">
                <textarea value={notifText} onChange={e => setNotifText(e.target.value)} rows={3} required
                  className={inputClass} placeholder="Ex : maintenance prévue ce soir…" />
                {notifMsg && <p className={`text-xs ${notifMsg.type === 'error' ? 'text-dangerRed' : 'text-emeraldLight'}`}>{notifMsg.text}</p>}
                <button className="self-start px-5 py-2.5 rounded-sm2 bg-gradient-to-br from-terracotta to-terracottaLight text-[#160e08] font-bold text-sm">Envoyer</button>
              </form>
            </div>
          </div>

          <h3 className="font-display text-base font-semibold mb-3">Vérifications KYC à traiter</h3>
          <div className="bg-bgCard border border-borderC rounded-card p-2 mb-8">
            {pendingKyc.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-borderC last:border-none">
                <div>
                  <div className="font-semibold text-sm">{u.full_name} {u.first_names}</div>
                  <div className="text-textMuted text-[11.5px] font-mono">{u.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveKyc(u.id, true)} className="w-8 h-8 rounded-lg bg-emerald/15 text-emeraldLight"><i className="fa-solid fa-check"></i></button>
                  <button onClick={() => approveKyc(u.id, false)} className="w-8 h-8 rounded-lg bg-dangerRed/15 text-dangerRed"><i className="fa-solid fa-xmark"></i></button>
                </div>
              </div>
            ))}
            {pendingKyc.length === 0 && <p className="text-textMuted text-sm px-4 py-4">Aucune vérification en attente.</p>}
          </div>

          <h3 className="font-display text-base font-semibold mb-3">Ordres à valider</h3>
          <div className="bg-bgCard border border-borderC rounded-card p-2">
            {pendingOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 border-b border-borderC last:border-none">
                <div>
                  <div className="font-semibold text-sm">{o.type === 'buy' ? 'Achat' : 'Vente'} · {o.crypto_amount} {o.pair.split('/')[0]} — {o.profiles?.email}</div>
                  <div className="text-textMuted text-[11.5px] font-mono">{Number(o.ariary_amount).toLocaleString('fr-FR')} Ar</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decideOrder(o.id, true)} className="w-8 h-8 rounded-lg bg-emerald/15 text-emeraldLight"><i className="fa-solid fa-check"></i></button>
                  <button onClick={() => decideOrder(o.id, false)} className="w-8 h-8 rounded-lg bg-dangerRed/15 text-dangerRed"><i className="fa-solid fa-xmark"></i></button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && <p className="text-textMuted text-sm px-4 py-4">Aucun ordre en attente.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-bgCard border border-borderC rounded-card p-5">
      <div className="w-9 h-9 rounded-lg bg-vanilla/15 text-vanillaLight flex items-center justify-center mb-3.5">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="text-[11.5px] uppercase tracking-wide text-textSecondary font-semibold mb-1.5">{label}</div>
      <div className="font-mono text-[22px] font-semibold">{value}</div>
    </div>
  )
}
