import { anthropic, MODEL, extractText, extractJson } from './claude';
import { LinkedInDump } from './linkedin';

export type Profile = {
  fullName: string;
  headline?: string;
  location?: string;
  email?: string;
  phone?: string;
  summary?: string;
  links?: { label: string; url: string }[];
  experience: {
    company: string;
    title: string;
    location?: string;
    start: string;
    end?: string;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree?: string;
    field?: string;
    start?: string;
    end?: string;
    notes?: string;
  }[];
  skills: string[];
  languages: { name: string; level?: string }[];
  certifications: { name: string; issuer?: string; date?: string }[];
  projects: { name: string; description?: string; url?: string }[];
  awards: { name: string; issuer?: string; date?: string }[];
};

const SYSTEM = `You are building a canonical structured profile of a job seeker.
Merge every input source (LinkedIn export, previous CVs, free-text notes, links).
No invention: use only facts present in the sources. Dates in YYYY-MM format when possible.
Prefer the most detailed / most recent phrasing for each fact.
Output pure JSON matching the schema. No commentary.`;

const SCHEMA_HINT = `{
  "fullName": string,
  "headline": string?,
  "location": string?,
  "email": string?,
  "phone": string?,
  "summary": string?,
  "links": [{ "label": string, "url": string }],
  "experience": [{ "company": string, "title": string, "location": string?, "start": string, "end": string?, "bullets": string[] }],
  "education": [{ "school": string, "degree": string?, "field": string?, "start": string?, "end": string?, "notes": string? }],
  "skills": string[],
  "languages": [{ "name": string, "level": string? }],
  "certifications": [{ "name": string, "issuer": string?, "date": string? }],
  "projects": [{ "name": string, "description": string?, "url": string? }],
  "awards": [{ "name": string, "issuer": string?, "date": string? }]
}`;

export async function buildProfile(args: {
  linkedin?: LinkedInDump;
  cvPdfs: { name: string; base64: string }[];
  freeText?: string;
  links?: { label: string; url: string }[];
}): Promise<Profile> {
  const content: any[] = [];

  const parts: string[] = [
    'SCHEMA:\n' + SCHEMA_HINT,
    args.freeText ? 'FREE-TEXT NOTES:\n' + args.freeText : '',
    args.links?.length ? 'LINKS:\n' + args.links.map(l => `- ${l.label}: ${l.url}`).join('\n') : '',
    args.linkedin ? 'LINKEDIN EXPORT (parsed CSV rows):\n' + JSON.stringify(args.linkedin, null, 2).slice(0, 60_000) : ''
  ].filter(Boolean);

  content.push({ type: 'text', text: parts.join('\n\n') });

  for (const cv of args.cvPdfs) {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: cv.base64 },
      title: cv.name
    });
  }

  content.push({ type: 'text', text: 'Return only the JSON object. No prose.' });

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: 'user', content }]
  });

  const text = extractText(resp);
  return extractJson<Profile>(text);
}
