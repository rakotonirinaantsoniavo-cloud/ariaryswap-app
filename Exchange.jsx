import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function Exchange() {
  const { profile } = useAuth()
  const [rates, setRates] = useState([])
  const [pair, setPair] = useState('USDT/MGA')
  const [type, setType] = useState('buy')
  const [ariaryAmount, setAriaryAmount] = useState('')
  const [wallets, setWallets] = useState([])
  const [phones, setPhones] = useState([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const kycOk = profile?.kyc_status === 'approved'
  const currentRate = rates.find(r => r.pair === pair)?.rate || 0
  const cryptoAmount = currentRate ? (Number(ariaryAmount || 0) / currentRate).toFixed(6) : '0'

  useEffect(() => {
    supabase.from('exchange_rates').select('*').then(({ data }) => setRates(data || []))
    if (profile?.id) {
      supabase.from('wallets').select('*').eq('user_id', profile.id).then(({ data }) => setWallets(data || []))
      supabase.from('phone_operators').select('*').eq('user_id', profile.id).then(({ data }) => setPhones(data || []))
    }
  }, [profile])

  async function submitOrder(e) {
    e.preventDefault()
    setMessage(null)
    if (!kycOk) { setMessage({ type: 'error', text: 'Votre KYC doit être approuvé avant de passer un ordre.' }); return }
    if (type === 'sell' && !selectedWallet) { setMessage({ type: 'error', text: 'Sélectionnez le wallet depuis lequel vous envoyez.' }); return }
    if (!selectedPhone) { setMessage({ type: 'error', text: 'Sélectionnez un numéro mobile.' }); return }

    setSubmitting(true)
    const { error } = await supabase.from('orders').insert({
      user_id: profile.id,
      type,
      pair,
      crypto_amount: Number(cryptoAmount),
      ariary_amount: Number(ariaryAmount),
      rate_applied: currentRate,
      wallet_id: selectedWallet || null,
      phone_operator_id: selectedPhone || null,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) setMessage({ type: 'error', text: error.message })
    else { setMessage({ type: 'success', text: 'Ordre envoyé. En attente de validation par l’admin.' }); setAriaryAmount('') }
  }

  return (
    <div className="flex h-screen bg-bgPrimary text-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Échanger" subtitle="Achetez ou vendez au taux fixé par l'admin" />
        <div className="flex-1 overflow-y-auto px-8 py-6 page-anim max-w-xl">
          {!kycOk && (
            <div className="flex items-center gap-2.5 bg-terracotta/10 border border-terracotta rounded-sm2 px-3.5 py-2.5 text-[12px] text-terracottaLight mb-5">
              <i className="fa-solid fa-triangle-exclamation"></i>
              Votre vérification KYC doit être approuvée avant de passer un ordre.
            </div>
          )}

          <div className="bg-bgCard border border-borderC rounded-card p-6">
            <div className="mb-4">
              <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Paire</label>
              <select value={pair} onChange={e => setPair(e.target.value)} className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 font-mono outline-none focus:border-vanilla">
                {rates.map(r => <option key={r.id} value={r.pair}>{r.pair}</option>)}
              </select>
            </div>

            <div className="flex gap-1 bg-bgPrimary rounded-sm2 p-1 mb-4">
              <button onClick={() => setType('buy')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'buy' ? 'bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary' : 'text-textSecondary'}`}>Acheter</button>
              <button onClick={() => setType('sell')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'sell' ? 'bg-gradient-to-br from-terracotta to-terracottaLight text-[#160e08]' : 'text-textSecondary'}`}>Vendre</button>
            </div>

            <form onSubmit={submitOrder} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Montant en Ariary</label>
                <input
                  type="number" min="0" required value={ariaryAmount}
                  onChange={e => setAriaryAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 font-mono outline-none focus:border-vanilla"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Vous {type === 'buy' ? 'recevez' : 'envoyez'} (crypto)</label>
                <input readOnly value={cryptoAmount} className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 font-mono text-textSecondary" />
              </div>

              {type === 'sell' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Wallet source</label>
                  <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 outline-none focus:border-vanilla">
                    <option value="">Sélectionner…</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.label} ({w.network})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Numéro pour recevoir / envoyer l'Ariary</label>
                <select value={selectedPhone} onChange={e => setSelectedPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 outline-none focus:border-vanilla">
                  <option value="">Sélectionner…</option>
                  {phones.map(p => <option key={p.id} value={p.id}>{p.operator} — {p.phone_number}</option>)}
                </select>
              </div>

              {message && (
                <p className={`text-xs ${message.type === 'error' ? 'text-dangerRed' : 'text-emeraldLight'}`}>{message.text}</p>
              )}

              <button
                disabled={submitting}
                className={`w-full py-3 rounded-sm2 font-bold text-sm disabled:opacity-60 ${type === 'buy' ? 'bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary' : 'bg-gradient-to-br from-terracotta to-terracottaLight text-[#160e08]'}`}
              >
                {submitting ? 'Envoi…' : `Passer l'ordre ${type === 'buy' ? "d'achat" : 'de vente'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
