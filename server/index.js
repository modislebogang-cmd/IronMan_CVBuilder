import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { store, publicUser } from './store.js'
import { generateResume } from './ai.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT) || 8787
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me'

const PLANS = {
  free: { id: 'free', name: 'Free', price: 0, credits: 0, aiGenerations: 0 },
  pro: { id: 'pro', name: 'Pro', price: 100, currency: 'R', credits: 20, aiGenerations: 5 },
}

const app = express()
app.use(express.json({ limit: '200kb' }))

/* ------------------------------- helpers ------------------------------- */

const signToken = (user) => jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' })
  try {
    const { sub } = jwt.verify(token, JWT_SECRET)
    const user = store.findUserById(sub)
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' })
  }
}

const blankResume = () => ({
  fullName: '',
  role: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  experience: '',
  education: '',
  skills: '',
  jobTitle: '',
  company: '',
})

/* -------------------------------- auth --------------------------------- */

const credentials = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

app.post('/api/auth/register', async (req, res) => {
  const parsed = credentials.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const { name, email, password } = parsed.data
  if (store.findUserByEmail(email)) return res.status(409).json({ error: 'That email is already registered.' })

  const user = {
    id: randomUUID(),
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    plan: 'free',
    credits: 0,
    generationsUsed: 0,
    resume: blankResume(),
    createdAt: new Date().toISOString(),
  }
  store.addUser(user)
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  // FIX #1: login no longer reuses the register schema (min-8 password + name),
  // which returned a confusing 400 on the wrong-password path.
  const parsed = z
    .object({
      email: z.string().trim().email('Enter a valid email address'),
      password: z.string().min(1, 'Enter your password'),
    })
    .safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const user = store.findUserByEmail(parsed.data.email)
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash))
  if (!ok) return res.status(401).json({ error: 'Email or password is incorrect.' })
  res.json({ token: signToken(user), user: publicUser(user) })
})

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

/* ------------------------------- profile ------------------------------- */

const resumeSchema = z.object({
  fullName: z.string().max(80).default(''),
  role: z.string().max(80).default(''),
  email: z.string().max(120).default(''),
  phone: z.string().max(40).default(''),
  location: z.string().max(80).default(''),
  summary: z.string().max(2000).default(''),
  experience: z.string().max(5000).default(''),
  education: z.string().max(2000).default(''),
  skills: z.string().max(1000).default(''),
  jobTitle: z.string().max(80).default(''),
  company: z.string().max(80).default(''),
})

app.put('/api/resume', auth, (req, res) => {
  const parsed = resumeSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })
  const resume = { ...blankResume(), ...req.user.resume, ...parsed.data }
  const user = store.updateUser(req.user.id, { resume })
  res.json({ resume: user.resume })
})

const strictResume = resumeSchema.strict()

app.post('/api/resume/generate', auth, async (req, res) => {
  const plan = PLANS[req.user.plan] ?? PLANS.free
  const body = strictResume.partial().safeParse(req.body ?? {})
  if (!body.success) return res.status(400).json({ error: body.error.issues[0].message })
  if (plan.id === 'free') {
    return res.status(402).json({
      error: 'AI generation is a paid feature. Upgrade to Pro (R100) to unlock it.',
      code: 'UPGRADE_REQUIRED',
    })
  }
  if ((req.user.credits ?? 0) <= 0) {
    return res.status(402).json({ error: 'You are out of credits. Top up your Pro plan.', code: 'NO_CREDITS' })
  }
  const input = { ...blankResume(), ...req.user.resume, ...body.data }
  const draft = await generateResume(input)
  const user = store.updateUser(req.user.id, {
    credits: req.user.credits - 1,
    generationsUsed: (req.user.generationsUsed ?? 0) + 1,
    resume: { ...input, ...draft, summary: draft.summary, experience: draft.experience.map((e) => `- ${e.bullets.join('\n- ')}`).join('\n') },
  })
  res.json({ draft, user: publicUser(user) })
})

/* ------------------------------- billing ------------------------------- */

const purchaseSchema = z.object({
  plan: z.literal('pro'),
  // Interface only: shape a real card number takes. No real money moves.
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  cardName: z.string().trim().min(2, 'Name on card is required'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
})

app.get('/api/plans', (_req, res) => {
  res.json({
    plans: [
      { ...PLANS.free, features: ['1 resume draft', 'Live preview', 'Download as print/PDF', 'Manual editing'] },
      {
        ...PLANS.pro,
        features: ['Unlimited resume drafts', `${PLANS.pro.credits} AI credits`, 'AI summary + bullet rewriting', 'Recruiter-ready suggestions', 'Priority support'],
      },
    ],
  })
})

app.get('/api/billing/payments', auth, (req, res) => {
  res.json({ payments: store.paymentsFor(req.user.id) })
})

app.post('/api/billing/purchase', auth, (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  // Interface-only "gateway": simulates a successful authorisation.
  const payment = {
    id: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
    userId: req.user.id,
    plan: 'pro',
    amount: PLANS.pro.price,
    currency: 'R',
    status: 'paid',
    last4: parsed.data.cardNumber.slice(-4),
    createdAt: new Date().toISOString(),
  }
  store.addPayment(payment)
  const user = store.updateUser(req.user.id, {
    plan: 'pro',
    credits: (req.user.credits ?? 0) + PLANS.pro.credits,
  })
  res.json({ payment, user: publicUser(user) })
})

/* --------------------------- production static -------------------------- */

const distDir = join(root, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')))
}

// Catch-all for unknown API routes. Written as a middleware rather than
// app.use('/api', …) so it can never swallow the error handler below.
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found.' })
  res.status(404).send('Not found')
})

// Express error handler — never leak stack traces to the client.
app.use((err, _req, res, _next) => {
  console.error('[api] unhandled error:', err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

app.listen(PORT, () => {
  console.log(`[api] IronMan_ResumeBuilder API listening on http://localhost:${PORT}`)
})
