import { claudeCall, extractJson } from './claude';

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
  const text = await claudeCall({
    system: PARSE_SYSTEM,
    prompt: `Schema:
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
  });
  return extractJson<JobParsed>(text);
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
  const text = await claudeCall({
    system: `You are a research analyst. Use web search to find current, credible information.
Do not invent facts. Every claim should be backed by something found via search.
Return pure JSON matching the schema.`,
    webSearch: true,
    prompt: `Research the company "${companyName}" for a job application.

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
  });
  return extractJson<CompanyResearch>(text);
}
