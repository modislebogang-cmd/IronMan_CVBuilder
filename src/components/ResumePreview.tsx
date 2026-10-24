import type { ResumeData } from '../types'

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)

export default function ResumePreview({ resume }: { resume: ResumeData }) {
  const skills = resume.skills
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const experience = lines(resume.experience)
  const education = lines(resume.education)

  return (
    <article className="resume-sheet" id="resume-sheet" aria-label="Resume preview">
      <header className="rs-header">
        <div className="rs-avatar" aria-hidden="true">
          {(resume.fullName || 'Y').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="rs-name">{resume.fullName || 'Your Name'}</h2>
          <p className="rs-role">{resume.role || 'Your Target Role'}</p>
          <p className="rs-contact">
            {[resume.email || 'you@email.com', resume.phone, resume.location].filter(Boolean).join('  •  ')}
          </p>
        </div>
      </header>

      <hr className="rs-rule" />

      <section className="rs-section">
        <h3>Professional Summary</h3>
        <p className="rs-text">
          {resume.summary || 'Your AI-crafted professional summary will appear here once you generate a draft.'}
        </p>
      </section>

      <section className="rs-section">
        <h3>Experience</h3>
        {experience.length ? (
          <ul className="rs-list">
            {experience.map((item, i) => (
              <li key={`${i}-${item.slice(0, 20)}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="rs-text rs-muted">Add roles and achievements to fill this section.</p>
        )}
      </section>

      <section className="rs-section">
        <h3>Education</h3>
        {education.length ? (
          <ul className="rs-list">
            {education.map((item, i) => (
              <li key={`${i}-${item.slice(0, 20)}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="rs-text rs-muted">Add your qualifications and institutions.</p>
        )}
      </section>

      <section className="rs-section">
        <h3>Skills</h3>
        {skills.length ? (
          <ul className="rs-skills">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <p className="rs-text rs-muted">List your core skills, separated by commas.</p>
        )}
      </section>

      <footer className="rs-footer">Built with IronMan_ResumeBuilder</footer>
    </article>
  )
}
