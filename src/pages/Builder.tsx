import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { blankResume, type AiDraft, type ResumeData } from '../types'
import ResumePreview from '../components/ResumePreview'
import { DownloadIcon, LockIcon, SparkIcon } from '../components/Icons'

const FIELDS = [
  { key: 'fullName', label: 'Full name', placeholder: 'Tony Stark', autoComplete: 'name' },
  { key: 'role', label: 'Target role', placeholder: 'Mechanical Engineer', autoComplete: 'organization-title' },
  { key: 'email', label: 'Email', placeholder: 'tony@starkindustries.com', autoComplete: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+27 82 000 0000', autoComplete: 'tel' },
  { key: 'location', label: 'Location', placeholder: 'Cape Town, ZA', autoComplete: 'address-level2' },
] as const

const AREAS = [
  { key: 'summary', label: 'Professional summary', rows: 4, placeholder: 'A short pitch about you…' },
  {
    key: 'experience',
    label: 'Experience (one achievement per line)',
    rows: 6,
    placeholder: '- Built a self-sustaining arc reactor\n- Led a team of 12 engineers',
  },
  { key: 'education', label: 'Education', rows: 3, placeholder: 'BSc Mechanical Engineering, MIT, 2019' },
  { key: 'skills', label: 'Skills (comma separated)', rows: 2, placeholder: 'React, Node.js, CAD, TypeScript' },
] as const

export default function Builder() {
  const { user, generate } = useAuth()
  const [resume, setResume] = useState<ResumeData>(user?.resume ?? blankResume())
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState<AiDraft | null>(null)
  const [generating, setGenerating] = useState(false)
  const dirty = useRef(false)
  const resumeRef = useRef(resume)
  resumeRef.current = resume

  // Pick up server-side changes (e.g. an AI draft) exactly once on mount.
  useEffect(() => {
    if (user?.resume) setResume({ ...blankResume(), ...user.resume })
  }, [])

  // Autosave: debounced PUT after the user edits, never on the initial load.
  useEffect(() => {
    if (!dirty.current) return
    const id = setTimeout(async () => {
      setSaved('saving')
      try {
        await api('/resume', { method: 'PUT', body: JSON.stringify(resumeRef.current) })
        setSaved('saved')
      } catch {
        setSaved('error')
      }
    }, 700)
    return () => clearTimeout(id)
  }, [resume])

  const update = (key: keyof ResumeData, value: string) => {
    dirty.current = true
    setResume((prev) => ({ ...prev, [key]: value }))
  }

  const onGenerate = async () => {
    setError('')
    setNotice('')
    setGenerating(true)
    try {
      const result = await generate(resume)
      setDraft(result)
      const next: ResumeData = {
        ...resume,
        summary: result.summary,
        experience: result.experience.map((e) => e.bullets.map((b) => `- ${b}`).join('\n')).join('\n'),
        skills: result.skills.join(', '),
        education: result.education || resume.education,
      }
      dirty.current = true
      setResume(next)
      setNotice('AI draft applied. Review the highlights, then save your file.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const printResume = () => window.print()

  return (
    <div className="builder-page">
      <div className="builder-head">
        <div>
          <h1>Resume builder</h1>
          <p className="muted">
            Fill in the details on the left — the live preview updates instantly.
            <span className="save-state" data-state={saved}>
              {saved === 'saving' && ' Saving…'}
              {saved === 'saved' && ' Saved ✓'}
              {saved === 'error' && ' Could not save'}
            </span>
          </p>
        </div>
        <div className="builder-actions">
          <button className="btn btn-outline" onClick={printResume}>
            <DownloadIcon width={16} height={16} /> Export PDF
          </button>
          {user?.hasPaidPlan ? (
            <button className="btn btn-gold" onClick={onGenerate} disabled={generating || user.credits <= 0}>
              <SparkIcon width={16} height={16} />
              {generating ? 'Forging draft…' : `Generate with AI (${user.credits})`}
            </button>
          ) : (
            <Link to="/pricing" className="btn btn-gold">
              <LockIcon width={16} height={16} /> Unlock AI — R100
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          {error.toLowerCase().includes('paid') || error.toLowerCase().includes('credit') ? (
            <Link to="/pricing" className="alert-link">
              View plans
            </Link>
          ) : null}
        </div>
      )}
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="builder-grid">
        <form className="card builder-form" onSubmit={(e) => e.preventDefault()}>
          <h2>Your details</h2>
          {FIELDS.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input
                value={resume[f.key]}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </label>
          ))}

          <h3 className="section-title">AI inputs</h3>
          <label className="field">
            <span>Job title</span>
            <input
              value={resume.jobTitle}
              placeholder="Senior Engineer"
              onChange={(e) => update('jobTitle', e.target.value)}
            />
          </label>
          <label className="field">
            <span>Company</span>
            <input
              value={resume.company}
              placeholder="Stark Industries"
              onChange={(e) => update('company', e.target.value)}
            />
          </label>

          {AREAS.map((a) => (
            <label className="field" key={a.key}>
              <span>{a.label}</span>
              <textarea
                rows={a.rows}
                value={resume[a.key]}
                placeholder={a.placeholder}
                onChange={(e) => update(a.key, e.target.value)}
              />
            </label>
          ))}
        </form>

        <div className="preview-column">
          <ResumePreview resume={resume} />
          {draft && (
            <aside className="card suggestions">
              <h3>
                <SparkIcon width={16} height={16} /> Recruiter suggestions
              </h3>
              <ul>
                {draft.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
