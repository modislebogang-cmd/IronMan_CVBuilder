export type PlanId = 'free' | 'pro'

export interface User {
  id: string
  name: string
  email: string
  plan: PlanId
  credits: number
  generationsUsed: number
  hasPaidPlan: boolean
  resume: ResumeData
}

export interface ResumeData {
  fullName: string
  role: string
  email: string
  phone: string
  location: string
  summary: string
  experience: string
  education: string
  skills: string
  jobTitle: string
  company: string
}

export interface AiDraft {
  headline: string
  summary: string
  experience: { title: string; company: string; bullets: string[] }[]
  skills: string[]
  education: string
  suggestions: string[]
}

export interface Payment {
  id: string
  plan: PlanId
  amount: number
  currency: string
  status: string
  last4: string
  createdAt: string
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  currency?: string
  credits: number
  features: string[]
}

export const blankResume = (): ResumeData => ({
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
