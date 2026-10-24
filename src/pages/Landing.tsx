import { Link } from 'react-router-dom'
import IronManLogo from '../components/IronManLogo'
import { BoltIcon, BuilderIcon, CheckIcon, SparkIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    Icon: SparkIcon,
    title: 'AI-powered drafting',
    text: 'Paste rough notes and Stark-grade AI rewrites them into quantified, recruiter-ready bullets.',
  },
  {
    Icon: BuilderIcon,
    title: 'Live resume preview',
    text: 'Watch your resume assemble in real time, then export it print-perfect as a PDF.',
  },
  {
    Icon: BoltIcon,
    title: 'Credits, not subscriptions',
    text: 'Start on Free for R0. Buy the Pro pass for R100 and unlock 20 AI credits.',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const primaryTo = user ? '/builder' : '/register'

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">
            <BoltIcon width={14} height={14} /> Powered-up careers
          </span>
          <h1>
            Build a resume with <span className="accent-gold">Stark</span>{' '}
            <span className="accent-red">precision.</span>
          </h1>
          <p className="lead">
            IronMan_ResumeBuilder turns your experience into a recruiter-ready resume with live preview,
            AI rewrites and one-click export. Suit up in minutes.
          </p>
          <div className="hero-actions">
            <Link to={primaryTo} className="btn btn-primary btn-lg">
              {user ? 'Open my builder' : 'Build my resume — free'}
            </Link>
            <Link to="/pricing" className="btn btn-outline btn-lg">
              See plans
            </Link>
          </div>
          <ul className="hero-points">
            <li>
              <CheckIcon width={16} height={16} /> No card needed for Free
            </li>
            <li>
              <CheckIcon width={16} height={16} /> Pro from R100
            </li>
            <li>
              <CheckIcon width={16} height={16} /> Export to PDF
            </li>
          </ul>
        </div>

        <div className="hero-visual">
          <div className="reactor-ring ring-1" />
          <div className="reactor-ring ring-2" />
          <IronManLogo size={230} />
          <p className="hero-caption">Drag the helmet — I am here, and I am ready.</p>
        </div>
      </section>

      <section className="features" aria-label="Features">
        {features.map(({ Icon, title, text }) => (
          <article key={title} className="card feature-card">
            <span className="feature-icon">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="cta-band">
        <div>
          <h2>Your next role is waiting.</h2>
          <p>Register in seconds, draft free, and unlock AI when you are ready.</p>
        </div>
        <Link to={primaryTo} className="btn btn-gold btn-lg">
          {user ? 'Continue building' : 'Create free account'}
        </Link>
      </section>
    </>
  )
}
