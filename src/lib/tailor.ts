import { claudeCall, extractJson } from './claude';
import { Profile } from './profile';
import { JobParsed, CompanyResearch } from './job';

export type TailoredCV = {
  language: 'pl' | 'en';
  fullName: string;
  headline: string;
  contact: { email?: string; phone?: string; location?: string; links?: { label: string; url: string }[] };
  summary: string;
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
  certifications?: { name: string; issuer?: string; date?: string }[];
  projects?: { name: string; description?: string; url?: string }[];
  awards?: { name: string; issuer?: string; date?: string }[];
  match_report: {
    covered_requirements: { requirement: string; evidence: string }[];
    gaps: string[];
    top_achievements_used: string[];
  };
};

const SYSTEM_EN = `You write tailored CVs for specific job offers. No bullshit, no filler, no invented facts.

Core rule: every CV must be built for the specific job in front of you. Reordering, phrasing, and emphasis all serve one goal - making the recruiter see, within 20 seconds, that this candidate fits the role.

Workflow you follow internally:
1. Read the job's must-have and nice-to-have requirements and the recruiter's implicit signals (culture, seniority, industry).
2. Map each requirement to the strongest evidence in the candidate profile.
3. Identify the top 3-5 achievements in the profile most likely to impress this recruiter for this role. Elevate them.
4. Choose skills, bullets, and ordering so those matches surface first.

Hard rules:
- Use ONLY facts present in the candidate profile. Never fabricate roles, dates, metrics, tools, or achievements. Rephrasing is OK, invention is not.
- Reorder experience bullets so role-relevant ones sit on top. Drop irrelevant ones.
- Bullets: past-tense action verbs, quantified when the profile has numbers, max 22 words, no adjectives like "passionate" or "results-driven".
- Skills: only from profile, ranked by relevance to the role.
- Summary: 2-3 concrete sentences tied to the target role. No cliches.
- Headline: aligned with the role's title if the candidate's actual experience supports it.
- Keywords: naturally weave the job's own vocabulary into bullets when it truthfully applies. This helps ATS and recruiter scanning.
- Aim to fit one page. Trim aggressively.
- Language: write everything in the target language.

You must also produce a match_report showing which job requirements are covered by which profile evidence, and which are gaps. This is for internal review, not printed on the CV.

Output pure JSON. No commentary.`;

const SYSTEM_PL = `Piszesz CV dopasowane do konkretnej oferty. Zero lania wody, zero pustych ozdobnikow, zero zmyslania.

Zasada nadrzedna: kazde CV powstaje pod konkretna oferte. Kolejnosc, sformulowania i akcenty maja jeden cel - zeby rekruter w 20 sekund zobaczyl, ze kandydatka pasuje.

Wewnetrzny proces:
1. Przeczytaj wymagania oferty (must-have, nice-to-have) i sygnaly od rekrutera (kultura, seniority, branza).
2. Zmapuj kazde wymaganie na najmocniejszy dowod z profilu.
3. Wybierz 3-5 najsilniejszych osiagniec z profilu ktore najbardziej zrobia wrazenie na tym rekruterze dla tej roli. Wybij je.
4. Ulozy umiejetnosci, punkty i kolejnosc tak, zeby dopasowania byly widoczne od razu.

Twarde zasady:
- Uzywaj WYLACZNIE faktow z profilu kandydatki. Nie wymyslaj stanowisk, dat, liczb, narzedzi ani osiagniec. Parafraza OK, wymyslanie nie.
- Ustaw punkty od najbardziej istotnych dla roli. Nieistotne tnij.
- Punkty: czasowniki dokonane, konkretne liczby jesli sa w profilu, max 22 slowa, bez "pasjonatka" i "zorientowana na wynik".
- Umiejetnosci: tylko z profilu, uszeregowane po dopasowaniu.
- Podsumowanie: 2-3 konkretne zdania zwiazane z rola. Bez frazesow.
- Naglowek: zgodny z tytulem roli jesli faktyczne doswiadczenie na to pozwala.
- Slownictwo z oferty: wpleciaj naturalnie w punkty, gdy naprawde pasuje. Pomaga ATS i skanowaniu przez rekrutera.
- Cel: jedna strona. Tnij ostro.
- Jezyk: pisz wszystko po polsku.

Dodatkowo generujesz match_report: ktore wymagania oferty pokrywa jaki dowod z profilu i gdzie sa luki. To do wewnetrznego przegladu, na CV sie nie drukuje.

Zwroc czysty JSON. Bez komentarza.`;

export async function tailorCV(args: {
  profile: Profile;
  job: JobParsed;
  research: CompanyResearch;
  language: 'pl' | 'en';
}): Promise<TailoredCV> {
  const system = args.language === 'pl' ? SYSTEM_PL : SYSTEM_EN;
  const text = await claudeCall({
    system,
    prompt: `CANDIDATE PROFILE (source of truth, do not invent beyond this):
${JSON.stringify(args.profile, null, 2)}

JOB POSTING (parsed):
${JSON.stringify(args.job, null, 2)}

COMPANY RESEARCH:
${JSON.stringify(args.research, null, 2)}

Produce a tailored CV in language "${args.language}". Schema:
{
  "language": "${args.language}",
  "fullName": string,
  "headline": string,
  "contact": { "email": string?, "phone": string?, "location": string?, "links": [{"label": string, "url": string}]? },
  "summary": string,
  "experience": [{ "company": string, "title": string, "location": string?, "start": string, "end": string?, "bullets": string[] }],
  "education": [{ "school": string, "degree": string?, "field": string?, "start": string?, "end": string?, "notes": string? }],
  "skills": string[],
  "languages": [{"name": string, "level": string?}],
  "certifications": [{"name": string, "issuer": string?, "date": string?}]?,
  "projects": [{"name": string, "description": string?, "url": string?}]?,
  "awards": [{"name": string, "issuer": string?, "date": string?}]?,
  "match_report": {
    "covered_requirements": [{"requirement": string, "evidence": string}],
    "gaps": string[],
    "top_achievements_used": string[]
  }
}

Return only the JSON.`
  });
  return extractJson<TailoredCV>(text);
}
