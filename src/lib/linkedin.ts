import AdmZip from 'adm-zip';

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const header = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = splitLine(line);
    const row: Row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export type LinkedInDump = {
  profile?: Row;
  positions?: Row[];
  education?: Row[];
  skills?: Row[];
  certifications?: Row[];
  languages?: Row[];
  projects?: Row[];
  honors?: Row[];
  publications?: Row[];
  volunteering?: Row[];
  courses?: Row[];
  emails?: Row[];
  raw_files: string[];
};

export async function parseLinkedInZip(buf: Buffer): Promise<LinkedInDump> {
  const zip = new AdmZip(buf);
  const dump: LinkedInDump = { raw_files: [] };
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    dump.raw_files.push(entry.entryName);
    const name = entry.entryName.toLowerCase();
    if (!name.endsWith('.csv')) continue;
    const content = entry.getData().toString('utf8');
    const rows = parseCsv(content);
    if (name.includes('profile.csv')) dump.profile = rows[0];
    else if (name.includes('positions')) dump.positions = rows;
    else if (name.includes('education')) dump.education = rows;
    else if (name.includes('skills')) dump.skills = rows;
    else if (name.includes('certifications')) dump.certifications = rows;
    else if (name.includes('languages')) dump.languages = rows;
    else if (name.includes('projects')) dump.projects = rows;
    else if (name.includes('honors')) dump.honors = rows;
    else if (name.includes('publications')) dump.publications = rows;
    else if (name.includes('volunteering')) dump.volunteering = rows;
    else if (name.includes('courses')) dump.courses = rows;
    else if (name.includes('email addresses')) dump.emails = rows;
  }
  return dump;
}
