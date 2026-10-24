import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { Payment } from '../types'
import { BoltIcon, UserIcon } from '../components/Icons'

export default function Account() {
  const { user, logout } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ payments: Payment[] }>('/billing/payments')
      .then((res) => setPayments(res.payments))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load payments'))
  }, [])

  if (!user) return null

  return (
    <div className="account-page">
      <header className="page-head">
        <span className="eyebrow">
          <UserIcon width={14} height={14} /> Account
        </span>
        <h1>Hi, {user.name}</h1>
        <p className="muted">{user.email}</p>
      </header>

      <div className="account-grid">
        <section className="card">
          <h2>Plan</h2>
          <p className="plan-pill">
            <BoltIcon width={16} height={16} />
            {user.hasPaidPlan ? 'Pro' : 'Free'}
          </p>
          <dl className="stat-list">
            <div>
              <dt>AI credits</dt>
              <dd>{user.credits}</dd>
            </div>
            <div>
              <dt>Generations used</dt>
              <dd>{user.generationsUsed}</dd>
            </div>
          </dl>
          {user.hasPaidPlan ? (
            <Link to="/builder" className="btn btn-gold btn-block">
              Use a credit
            </Link>
          ) : (
            <Link to="/pricing" className="btn btn-primary btn-block">
              Upgrade to Pro — R100
            </Link>
          )}
        </section>

        <section className="card">
          <h2>Payments</h2>
          {error && <p className="alert alert-error">{error}</p>}
          {payments.length ? (
            <table className="payments">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Card</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>•••• {p.last4}</td>
                    <td>
                      {p.currency}
                      {p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No payments yet.</p>
          )}
        </section>

        <section className="card">
          <h2>Session</h2>
          <p className="muted">Log out on shared devices.</p>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            Log out
          </button>
        </section>
      </div>
    </div>
  )
}
