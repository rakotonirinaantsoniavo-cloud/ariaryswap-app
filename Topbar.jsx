import { useAuth } from '../context/AuthContext'

export default function Topbar({ title, subtitle }) {
  const { profile, signOut } = useAuth()

  return (
    <div className="px-8 py-5 bg-bgSecondary border-b border-borderC flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
      <div>
        <h2 className="font-display text-[22px] font-semibold -tracking-[0.2px]">
          {title}
          {subtitle && <small className="font-body font-normal text-textSecondary text-[13px] ml-2.5">{subtitle}</small>}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-textSecondary text-sm hidden sm:inline">{profile?.email}</span>
        <button
          onClick={signOut}
          className="w-[38px] h-[38px] rounded-full bg-bgCard border border-borderC text-textSecondary hover:bg-gradient-to-br hover:from-[#c98a2a] hover:to-[#f0cf7f] hover:text-[#14150f] hover:border-vanilla transition-all flex items-center justify-center"
          title="Déconnexion"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  )
}
