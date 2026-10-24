import { NavLink } from 'react-router-dom'
import { BuilderIcon, HomeIcon, PricingIcon, UserIcon } from './Icons'

const links = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/builder', label: 'Builder', Icon: BuilderIcon },
  { to: '/pricing', label: 'Pricing', Icon: PricingIcon },
  { to: '/account', label: 'Account', Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-inner">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
