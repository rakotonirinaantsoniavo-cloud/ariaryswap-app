import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const kycStatusLabel = { pending: 'À soumettre', submitted: 'En attente d’approbation', approved: 'Vérifié', rejected: 'Refusé — resoumettez' }

export default function WalletPage() {
  const { profile, refreshProfile } = useAuth()
  const [kycForm, setKycForm] = useState({ full_name: '', first_names: '', birth_date: '', address: '' })
  const [kycMsg, setKycMsg] = useState(null)

  const [wallets, setWallets] = useState([])
  const [walletForm, setWalletForm] = useState({ label: '', network: '' })
  const [scanFile, setScanFile] = useState(null)
  const [walletMsg, setWalletMsg] = useState(null)

  const [phones, setPhones] = useState([])
  const [phoneForm, setPhoneForm] = useState({ operator: 'Airtel', phone_number: '' })

  useEffect(() => {
    if (profile) {
      setKycForm({
        full_name: profile.full_name || '',
        first_names: profile.first_names || '',
        birth_date: profile.birth_date || '',
        address: profile.address || '',
      })
    }
    if (profile?.id) {
      supabase.from('wallets').select('*').eq('user_id', profile.id).then(({ data }) => setWallets(data || []))
      supabase.from('phone_operators').select('*').eq('user_id', profile.id).then(({ data }) => setPhones(data || []))
    }
  }, [profile])

  async function submitKyc(e) {
    e.preventDefault()
    setKycMsg(null)
    const { error } = await supabase.from('profiles').update({
      ...kycForm,
      kyc_status: 'submitted',
    }).eq('id', profile.id)
    if (error) setKycMsg({ type: 'error', text: error.message })
    else { setKycMsg({ type: 'success', text: 'Vérification envoyée.' }); refreshProfile() }
  }

  async function submitWallet(e) {
    e.preventDefault()
    setWalletMsg(null)
    if (!scanFile) { setWalletMsg({ type: 'error', text: "Importez une image du scan de l'adresse." }); return }

    const filePath = `${profile.id}/${Date.now()}-${scanFile.name}`
    const { error: uploadError } = await supabase.storage.from('wallet-scans').upload(filePath, scanFile)
    if (uploadError) { setWalletMsg({ type: 'error', text: uploadError.message }); return }

    const { data: urlData } = supabase.storage.from('wallet-scans').getPublicUrl(filePath)

    const { error } = await supabase.from('wallets').insert({
      user_id: profile.id,
      label: walletForm.label,
      network: walletForm.network,
      scan_image_url: urlData.publicUrl,
    })
    if (error) setWalletMsg({ type: 'error', text: error.message })
    else {
      setWalletMsg({ type: 'success', text: 'Wallet enregistré.' })
      setWalletForm({ label: '', network: '' }); setScanFile(null)
      supabase.from('wallets').select('*').eq('user_id', profile.id).then(({ data }) => setWallets(data || []))
    }
  }

  async function submitPhone(e) {
    e.preventDefault()
    const { error } = await supabase.from('phone_operators').insert({ user_id: profile.id, ...phoneForm })
    if (!error) {
      setPhoneForm({ operator: 'Airtel', phone_number: '' })
      supabase.from('phone_operators').select('*').eq('user_id', profile.id).then(({ data }) => setPhones(data || []))
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 outline-none focus:border-vanilla"

  return (
    <div className="flex h-screen bg-bgPrimary text-textPrimary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title="Portefeuille & KYC" subtitle="Gérez vos wallets et votre vérification" />
        <div className="flex-1 overflow-y-auto px-8 py-6 page-anim">
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* KYC */}
            <div className="bg-bgCard border border-borderC rounded-card p-6">
              <h3 className="font-display text-base font-semibold mb-3">Vérification KYC</h3>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-sm2 bg-vanilla/15 text-vanillaLight text-sm font-semibold mb-4">
                <i className="fa-solid fa-hourglass-half"></i>
                Statut : {kycStatusLabel[profile?.kyc_status] || 'À soumettre'}
              </div>
              <form onSubmit={submitKyc} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Nom</label>
                  <input value={kycForm.full_name} onChange={e => setKycForm({ ...kycForm, full_name: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Prénoms</label>
                  <input value={kycForm.first_names} onChange={e => setKycForm({ ...kycForm, first_names: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Date de naissance</label>
                  <input type="date" value={kycForm.birth_date} onChange={e => setKycForm({ ...kycForm, birth_date: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Adresse</label>
                  <input value={kycForm.address} onChange={e => setKycForm({ ...kycForm, address: e.target.value })} className={inputClass} required />
                </div>
                {kycMsg && <p className={`text-xs ${kycMsg.type === 'error' ? 'text-dangerRed' : 'text-emeraldLight'}`}>{kycMsg.text}</p>}
                <button className="mt-1 py-3 rounded-sm2 font-bold text-sm bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary">Soumettre la vérification</button>
              </form>
            </div>

            {/* Wallets + téléphones */}
            <div className="flex flex-col gap-5">
              <div className="bg-bgCard border border-borderC rounded-card p-6">
                <h3 className="font-display text-base font-semibold mb-3">Ajouter un wallet crypto</h3>
                <form onSubmit={submitWallet} className="flex flex-col gap-3">
                  <input placeholder="Nom (ex: Trust Wallet, Binance)" value={walletForm.label} onChange={e => setWalletForm({ ...walletForm, label: e.target.value })} className={inputClass} required />
                  <input placeholder="Réseau (TRC20, BEP20, ERC20…)" value={walletForm.network} onChange={e => setWalletForm({ ...walletForm, network: e.target.value })} className={inputClass} required />
                  <label className="border border-dashed border-borderWarm rounded-sm2 p-5 text-center text-textSecondary text-xs cursor-pointer hover:border-vanilla hover:text-vanillaLight transition-colors">
                    <i className="fa-solid fa-qrcode text-xl block mb-2 text-vanilla"></i>
                    {scanFile ? scanFile.name : "Importez l'image du scan de l'adresse"}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setScanFile(e.target.files[0])} required />
                  </label>
                  {walletMsg && <p className={`text-xs ${walletMsg.type === 'error' ? 'text-dangerRed' : 'text-emeraldLight'}`}>{walletMsg.text}</p>}
                  <button className="py-3 rounded-sm2 font-bold text-sm bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary">Enregistrer le wallet</button>
                </form>

                {wallets.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-borderC flex flex-col gap-2">
                    {wallets.map(w => (
                      <div key={w.id} className="flex justify-between text-sm">
                        <span className="font-semibold">{w.label}</span>
                        <span className="text-textMuted font-mono text-xs">{w.network}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-bgCard border border-borderC rounded-card p-6">
                <h3 className="font-display text-base font-semibold mb-3">Opérateurs mobiles</h3>
                <form onSubmit={submitPhone} className="flex gap-2 mb-4">
                  <select value={phoneForm.operator} onChange={e => setPhoneForm({ ...phoneForm, operator: e.target.value })} className={inputClass}>
                    <option>Airtel</option><option>Orange</option><option>Yas</option>
                  </select>
                  <input placeholder="03X XX XXX XX" value={phoneForm.phone_number} onChange={e => setPhoneForm({ ...phoneForm, phone_number: e.target.value })} className={inputClass} required />
                  <button className="px-4 rounded-sm2 bg-vanilla text-[#14150f] font-bold text-sm">+</button>
                </form>
                {phones.map(p => (
                  <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-borderC last:border-none">
                    <span className="font-semibold">{p.operator}</span>
                    <span className="font-mono text-textMuted text-xs">{p.phone_number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
