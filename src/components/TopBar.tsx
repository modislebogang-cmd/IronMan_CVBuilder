import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import IronManLogo from './IronManLogo'
import { BoltIcon } from './Icons'

export default function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="IronMan_ResumeBuilder home">
        <IronManLogo size={40} />
        <span className="brand-name">
          IronMan<span className="accent-red">_</span>ResumeBuilder
        </span>
      </Link>

      <div className="topbar-right">
        {user ? (
          <>
            <Link to="/pricing" className={`chip ${user.hasPaidPlan ? 'chip-gold' : 'chip-dim'}`}>
              <BoltIcon width={14} height={14} />
              {user.hasPaidPlan ? `Pro · ${user.credits} credits` : 'Free plan'}
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
