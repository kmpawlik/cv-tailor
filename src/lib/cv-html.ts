import { TailoredCV } from './tailor';

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function dateRange(start?: string, end?: string, lang: 'pl' | 'en' = 'en'): string {
  const present = lang === 'pl' ? 'obecnie' : 'present';
  if (!start && !end) return '';
  if (!end) return `${esc(start)} - ${present}`;
  return `${esc(start)} - ${esc(end)}`;
}

const LABELS = {
  en: {
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    certifications: 'Certifications',
    projects: 'Projects',
    awards: 'Awards'
  },
  pl: {
    summary: 'Podsumowanie',
    experience: 'Doswiadczenie',
    education: 'Wyksztalcenie',
    skills: 'Umiejetnosci',
    languages: 'Jezyki',
    certifications: 'Certyfikaty',
    projects: 'Projekty',
    awards: 'Nagrody'
  }
};

export function renderCvHtml(cv: TailoredCV): string {
  const L = LABELS[cv.language] || LABELS.en;
  const contactLine = [
    cv.contact.location,
    cv.contact.email,
    cv.contact.phone,
    ...(cv.contact.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`)
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const exp = cv.experience.map(e => `
    <div class="entry">
      <div class="entry-head">
        <div class="entry-title"><span class="role">${esc(e.title)}</span> <span class="at">·</span> <span class="company">${esc(e.company)}</span></div>
        <div class="entry-meta">${dateRange(e.start, e.end, cv.language)}${e.location ? ` &nbsp;·&nbsp; ${esc(e.location)}` : ''}</div>
      </div>
      <ul>${e.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>
  `).join('');

  const edu = cv.education.map(e => `
    <div class="entry compact">
      <div class="entry-head">
        <div class="entry-title"><span class="role">${esc(e.degree || '')}${e.field ? ', ' + esc(e.field) : ''}</span> <span class="at">·</span> <span class="company">${esc(e.school)}</span></div>
        <div class="entry-meta">${dateRange(e.start, e.end, cv.language)}</div>
      </div>
      ${e.notes ? `<div class="notes">${esc(e.notes)}</div>` : ''}
    </div>
  `).join('');

  const projects = cv.projects?.length ? `
    <section>
      <h2>${L.projects}</h2>
      ${cv.projects.map(p => `
        <div class="entry compact">
          <div class="entry-title">${esc(p.name)}${p.url ? ` <a class="proj-link" href="${esc(p.url)}">${esc(p.url)}</a>` : ''}</div>
          ${p.description ? `<div class="notes">${esc(p.description)}</div>` : ''}
        </div>
      `).join('')}
    </section>` : '';

  const certs = cv.certifications?.length ? `
    <section>
      <h2>${L.certifications}</h2>
      <ul class="flat">
        ${cv.certifications.map(c => `<li>${esc(c.name)}${c.issuer ? ` <span class="muted">- ${esc(c.issuer)}</span>` : ''}${c.date ? ` <span class="muted">(${esc(c.date)})</span>` : ''}</li>`).join('')}
      </ul>
    </section>` : '';

  const awards = cv.awards?.length ? `
    <section>
      <h2>${L.awards}</h2>
      <ul class="flat">
        ${cv.awards.map(a => `<li>${esc(a.name)}${a.issuer ? ` <span class="muted">- ${esc(a.issuer)}</span>` : ''}${a.date ? ` <span class="muted">(${esc(a.date)})</span>` : ''}</li>`).join('')}
      </ul>
    </section>` : '';

  return `<!doctype html>
<html lang="${cv.language}">
<head>
<meta charset="utf-8" />
<title>${esc(cv.fullName)} - CV</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    color: #111;
    font-size: 10.5pt;
    line-height: 1.42;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 18mm;
    margin: 0 auto;
    background: white;
  }
  header { border-bottom: 1px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 600;
    font-size: 26pt;
    line-height: 1;
    margin: 0 0 4px 0;
    letter-spacing: -0.01em;
  }
  .headline { font-size: 11pt; color: #444; margin-bottom: 6px; }
  .contact { font-size: 9pt; color: #333; }
  .contact a { color: #333; text-decoration: none; }
  h2 {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 500;
    font-size: 13pt;
    margin: 14px 0 6px 0;
    padding-bottom: 3px;
    border-bottom: 1px solid #ddd;
  }
  section { break-inside: avoid; }
  .summary { margin-bottom: 4px; }
  .entry { margin-bottom: 10px; break-inside: avoid; }
  .entry.compact { margin-bottom: 6px; }
  .entry-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .entry-title { font-weight: 600; }
  .role { }
  .at { color: #999; margin: 0 2px; }
  .company { font-weight: 500; }
  .entry-meta { color: #666; font-size: 9pt; white-space: nowrap; }
  .notes { color: #333; font-size: 10pt; margin-top: 2px; }
  ul { margin: 4px 0 0 18px; padding: 0; }
  ul li { margin: 2px 0; }
  ul.flat { margin: 0 0 0 18px; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px 10px; }
  .skill { border: 1px solid #ccc; padding: 2px 8px; border-radius: 999px; font-size: 9pt; }
  .langs { display: flex; flex-wrap: wrap; gap: 12px; font-size: 10pt; }
  .lang-name { font-weight: 500; }
  .muted { color: #666; }
  .proj-link { font-weight: 400; color: #444; font-size: 9pt; margin-left: 6px; }
  @page { size: A4; margin: 0; }
  @media print { body { background: white; } .page { box-shadow: none; margin: 0; } }
</style>
</head>
<body>
  <div class="page">
    <header>
      <h1>${esc(cv.fullName)}</h1>
      <div class="headline">${esc(cv.headline)}</div>
      <div class="contact">${contactLine}</div>
    </header>

    ${cv.summary ? `<section><h2>${L.summary}</h2><div class="summary">${esc(cv.summary)}</div></section>` : ''}

    <section>
      <h2>${L.experience}</h2>
      ${exp}
    </section>

    <section>
      <h2>${L.skills}</h2>
      <div class="skills">${cv.skills.map(s => `<span class="skill">${esc(s)}</span>`).join('')}</div>
    </section>

    ${projects}

    <section>
      <h2>${L.education}</h2>
      ${edu}
    </section>

    ${certs}
    ${awards}

    ${cv.languages?.length ? `
    <section>
      <h2>${L.languages}</h2>
      <div class="langs">
        ${cv.languages.map(l => `<div><span class="lang-name">${esc(l.name)}</span>${l.level ? ` <span class="muted">- ${esc(l.level)}</span>` : ''}</div>`).join('')}
      </div>
    </section>` : ''}
  </div>
</body>
</html>`;
}
