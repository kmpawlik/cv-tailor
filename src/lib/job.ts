import { anthropic, MODEL, extractText, extractJson } from './claude';

export type JobParsed = {
  companyName: string;
  roleTitle: string;
  location?: string;
  employmentType?: string;
  seniority?: string;
  summary: string;
  responsibilities: string[];
  requirements: {
    must_have: string[];
    nice_to_have: string[];
  };
  keywords: string[];
  language_detected: string;
};

const PARSE_SYSTEM = `Extract structured information from a job posting.
Return pure JSON. No commentary. If a field is unknown, use null or empty array.`;

export async function parseJob(rawText: string): Promise<JobParsed> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: PARSE_SYSTEM,
    messages: [{
      role: 'user',
      content: `Schema:
{
  "companyName": string,
  "roleTitle": string,
  "location": string?,
  "employmentType": string?,
  "seniority": string?,
  "summary": string,
  "responsibilities": string[],
  "requirements": { "must_have": string[], "nice_to_have": string[] },
  "keywords": string[],
  "language_detected": "pl" | "en" | string
}

Job posting text:
"""
${rawText}
"""

Return only the JSON.`
    }]
  });
  return extractJson<JobParsed>(extractText(resp));
}

export type CompanyResearch = {
  companyName: string;
  what_they_do: string;
  size_stage?: string;
  industry?: string;
  culture_signals: string[];
  recent_news: string[];
  tech_or_tools?: string[];
  competitors?: string[];
  sources: string[];
};

export async function researchCompany(companyName: string, jobContext: string): Promise<CompanyResearch> {
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: `You are a research analyst. Use web_search to find current, credible information.
Do not invent facts. Every claim should be backed by something found via web_search.
Return pure JSON matching the schema.`,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as any],
    messages: [{
      role: 'user',
      content: `Research the company "${companyName}" for a job application.

Context from the job posting:
"""
${jobContext.slice(0, 3000)}
"""

Find:
- What the company actually does (product, customers, business model)
- Size and stage (headcount, funding, revenue if public)
- Industry
- Culture signals from careers page, engineering blog, Glassdoor, founder posts
- Recent news from the last 12 months (launches, funding, layoffs, leadership changes)
- Tech stack or tools they publicly mention (only if relevant to the role)
- 2-3 direct competitors

Then return JSON:
{
  "companyName": string,
  "what_they_do": string,
  "size_stage": string?,
  "industry": string?,
  "culture_signals": string[],
  "recent_news": string[],
  "tech_or_tools": string[]?,
  "competitors": string[]?,
  "sources": string[]
}

Return only the JSON.`
    }]
  });
  return extractJson<CompanyResearch>(extractText(resp));
}
