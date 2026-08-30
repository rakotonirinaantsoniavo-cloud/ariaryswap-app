import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setShowReset(false)
    setLoading(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError("Email ou mot de passe incorrect.")
        setShowReset(true)
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Compte créé. Vérifiez votre email pour confirmer votre inscription.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function handleReset() {
    if (!email) { setError("Entrez votre email d'abord."); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else { setInfo('Email de réinitialisation envoyé.'); setShowReset(false) }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bgPrimary px-4">
      <div className="w-full max-w-[380px] bg-bgCard border border-borderC rounded-card p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c98a2a] via-[#e8bb56] to-[#f0cf7f] flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 2C9 7 5 9 5 14a7 7 0 0014 0c0-5-4-7-7-12z" fill="#14150f" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-semibold">AriarySwap</h1>
          <p className="text-textSecondary text-xs mt-1">Échange Ariary ⇄ Crypto</p>
        </div>

        <div className="flex gap-1 bg-bgPrimary rounded-sm2 p-1 mb-5">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'signin' ? 'bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary' : 'text-textSecondary'}`}
            onClick={() => setMode('signin')}
          >Se connecter</button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-gradient-to-br from-emerald to-emeraldLight text-bgPrimary' : 'text-textSecondary'}`}
            onClick={() => setMode('signup')}
          >S'inscrire</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 text-textPrimary outline-none focus:border-vanilla"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-textSecondary mb-1.5">Mot de passe</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bgPrimary border border-borderC rounded-sm2 text-textPrimary outline-none focus:border-vanilla"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-dangerRed text-xs">{error}</p>}
          {info && <p className="text-emeraldLight text-xs">{info}</p>}
          {showReset && (
            <button type="button" onClick={handleReset} className="text-vanillaLight text-xs text-left underline">
              Réinitialiser mon mot de passe
            </button>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-sm2 font-bold text-sm bg-gradient-to-br from-[#c98a2a] to-[#f0cf7f] text-[#14150f] disabled:opacity-60"
          >
            {mode === 'signin' ? 'Se connecter' : "Créer mon compte"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-borderC"></div>
          <span className="text-textMuted text-xs">ou</span>
          <div className="h-px flex-1 bg-borderC"></div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-2.5 rounded-sm2 border border-borderC text-textPrimary text-sm font-semibold flex items-center justify-center gap-2 hover:border-vanilla transition-colors"
        >
          <i className="fa-brands fa-google"></i> Continuer avec Google
        </button>
      </div>
    </div>
  )
}
