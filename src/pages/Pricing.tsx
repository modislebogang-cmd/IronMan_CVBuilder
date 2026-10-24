import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BoltIcon, CheckIcon } from '../components/Icons'

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    tagline: 'Everything you need to get moving.',
    features: ['1 resume draft', 'Live preview', 'Export as print/PDF', 'Manual editing'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 100,
    tagline: 'Stark-grade AI to sharpen every line.',
    features: [
      'Unlimited resume drafts',
      '20 AI credits',
      'AI summary + bullet rewriting',
      'Recruiter-ready suggestions',
      'Priority support',
    ],
  },
]

export default function Pricing() {
  const { user, purchase } = useAuth()
  const navigate = useNavigate()
  const [card, setCard] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const onBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } })
      return
    }
    setBusy(true)
    try {
      await purchase(card)
      setDone(true)
      setCard({ cardNumber: '', cardName: '', expiry: '', cvv: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pricing-page">
      <header className="page-head">
        <span className="eyebrow">
          <BoltIcon width={14} height={14} /> Plans
        </span>
        <h1>Choose your power level</h1>
        <p className="muted">No subscriptions. Buy once, get credits. Prices in South African Rand (ZAR).</p>
      </header>

      <div className="plans">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.id
          const isPro = plan.id === 'pro'
          return (
            <article key={plan.id} className={`card plan ${isPro ? 'plan-pro' : ''}`}>
              {isPro && <span className="plan-badge">Most popular</span>}
              <h2>{plan.name}</h2>
              <p className="plan-price">
                <span className="currency">R</span>
                {plan.price}
                <small>/ once</small>
              </p>
              <p className="muted">{plan.tagline}</p>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <CheckIcon width={16} height={16} /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button className="btn btn-outline btn-block" disabled>
                  Current plan
                </button>
              ) : (
                <a href="#checkout" className={`btn ${isPro ? 'btn-gold' : 'btn-outline'} btn-block`}>
                  {isPro ? 'Buy Pro — R100' : 'Start free'}
                </a>
              )}
            </article>
          )
        })}
      </div>

      <section className="card checkout" id="checkout">
        <h2>Buy the Pro plan</h2>
        <p className="muted">
          This is an interface demo — no real payment is processed and no card details are stored.
          Use any 16 digits, e.g. <code>4242 4242 4242 4242</code>.
        </p>

        {done && (
          <div className="alert alert-success" role="status">
            Payment mapped. Pro unlocked with {user?.credits ?? 0} AI credits.
            <Link to="/builder" className="alert-link">
              Open builder
            </Link>
          </div>
        )}
        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <form className="checkout-form" onSubmit={onBuy} noValidate>
          <label className="field">
            <span>Name on card</span>
            <input
              value={card.cardName}
              onChange={(e) => setCard({ ...card, cardName: e.target.value })}
              placeholder="Tony Stark"
              autoComplete="cc-name"
              required
            />
          </label>
          <label className="field">
            <span>Card number</span>
            <input
              value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
              placeholder="4242424242424242"
              inputMode="numeric"
              autoComplete="cc-number"
              required
            />
          </label>
          <div className="row">
            <label className="field">
              <span>Expiry (MM/YY)</span>
              <input
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                placeholder="12/29"
                autoComplete="cc-exp"
                required
              />
            </label>
            <label className="field">
              <span>CVV</span>
              <input
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                required
              />
            </label>
          </div>

          <div className="checkout-total">
            <span>Total due today</span>
            <strong>R100.00</strong>
          </div>

          <button type="submit" className="btn btn-gold btn-block btn-lg" disabled={busy}>
            {busy ? 'Authorising…' : user ? 'Pay R100 & unlock Pro' : 'Log in to buy'}
          </button>
        </form>
      </section>
    </div>
  )
}
