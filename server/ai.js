// Resume "AI" engine.
//
// Default provider works fully offline (no API key needed) so the app always
// runs. If OPENAI_API_KEY is set, set AI_PROVIDER=openai to swap in a real LLM
// with the same interface.

const ACTION_VERBS = [
  'Engineered',
  'Architected',
  'Automated',
  'Optimised',
  'Led',
  'Delivered',
  'Streamlined',
  'Accelerated',
]

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1)

function splitList(value = '') {
  return String(value)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function rewriteBullet(text, index) {
  const clean = text.replace(/^[-•*]\s*/, '').trim()
  if (!clean) return ''
  const verb = ACTION_VERBS[index % ACTION_VERBS.length]
  const lower = clean.charAt(0).toLowerCase() + clean.slice(1)
  const quantified = /\d/.test(lower) ? lower : `${lower}, improving delivery speed and quality`
  return `${verb} ${quantified}`
}

/**
 * Generates an improved resume draft from the user's raw input.
 * @param {object} input
 * @returns {{ summary: string, experience: {title:string, company:string, bullets:string[]}[], skills: string[], suggestions: string[] }}
 */
export async function generateResume(input) {
  const { fullName, role, experience = '', skills = '', education = '', jobTitle = '', company = '' } =
    input ?? {}

  const skillList = splitList(skills)
  const bullets = String(experience)
    .split('\n')
    .filter((line) => line.trim())
    .map(rewriteBullet)
    .filter(Boolean)

  const summary = [
    `Results-driven ${role || 'professional'} with hands-on experience`,
    company ? `at ${company}` : '',
    `specialising in ${skillList.slice(0, 4).join(', ') || 'high-impact delivery'}.`,
    `Known for turning complex requirements into shipped, measurable outcomes.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')

  const suggestions = []
  if (!/\d/.test(String(experience))) suggestions.push('Add numbers to your achievements (%, R, users, time saved).')
  if (skillList.length < 5) suggestions.push('List at least 5-8 skills; recruiters and ATS filters look for them.')
  if (!education) suggestions.push('Add your highest qualification and institution.')
  if (!jobTitle) suggestions.push('Add your current or target job title so the summary can be sharper.')
  if (!suggestions.length) suggestions.push('Draft looks strong — tailor 2-3 bullets to each job you apply for.')

  const draft = {
    headline: `${cap(role || 'Professional')} — ${skillList.slice(0, 3).join(' · ') || 'Iron-Certified'}`,
    summary,
    experience: [
      {
        title: jobTitle || role || 'Professional',
        company: company || 'Recent employer',
        bullets: bullets.length ? bullets : ['Add your achievements to see AI-rewritten bullets.'],
      },
    ],
    skills: skillList,
    education: String(education),
    suggestions,
  }

  if (process.env.AI_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    return openAiDraft(input, draft)
  }
  return draft
}

async function openAiDraft(input, fallback) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an expert resume writer. Return JSON with keys: headline, summary, experience (array of {title, company, bullets: string[]}), skills (string[]), education, suggestions (string[]). Use strong action verbs and quantification.',
          },
          { role: 'user', content: JSON.stringify(input) },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI ${res.status}`)
    const json = await res.json()
    return { ...fallback, ...JSON.parse(json.choices[0].message.content) }
  } catch (err) {
    console.warn('[ai] OpenAI call failed, using offline draft:', err.message)
    return fallback
  }
}
