// Tiny JSON-file persistence layer. No database to install — good enough for a
// dev/demo build. In production this module is the ONLY file you swap out
// (see README → "Recommended options").
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'server', 'data')
const dbFile = join(dataDir, 'db.json')

const emptyDb = () => ({ users: [], payments: [] })

function load() {
  if (!existsSync(dbFile)) return emptyDb()
  try {
    return { ...emptyDb(), ...JSON.parse(readFileSync(dbFile, 'utf8')) }
  } catch {
    return emptyDb()
  }
}

let db = load()

export function persist() {
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

export const store = {
  get users() {
    return db.users
  },
  get payments() {
    return db.payments
  },
  findUserByEmail(email) {
    return db.users.find((u) => u.email === email.toLowerCase()) ?? null
  },
  findUserById(id) {
    return db.users.find((u) => u.id === id) ?? null
  },
  addUser(user) {
    db.users.push(user)
    persist()
    return user
  },
  updateUser(id, patch) {
    const user = db.users.find((u) => u.id === id)
    if (!user) return null
    Object.assign(user, patch)
    persist()
    return user
  },
  addPayment(payment) {
    db.payments.push(payment)
    persist()
    return payment
  },
  paymentsFor(userId) {
    return db.payments.filter((p) => p.userId === userId)
  },
}

/** Strip secrets before sending a user over the wire. */
export function publicUser(user) {
  const { passwordHash: _passwordHash, ...safe } = user
  return { ...safe, hasPaidPlan: safe.plan !== 'free', credits: safe.credits ?? 0 }
}
