import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export const MODEL = 'claude-sonnet-4-6';

export type ClaudeCallArgs = {
  system: string;
  prompt: string;
  webSearch?: boolean;
  pdfAttachments?: { name: string; base64: string }[];
  maxTurns?: number;
};

async function writePdfsToTemp(pdfs: { name: string; base64: string }[]): Promise<string[]> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cvt-'));
  const paths: string[] = [];
  for (let i = 0; i < pdfs.length; i++) {
    const safe = pdfs[i].name.replace(/[^a-zA-Z0-9._-]/g, '_') || `cv-${i}.pdf`;
    const p = path.join(tmp, safe);
    await fs.writeFile(p, Buffer.from(pdfs[i].base64, 'base64'));
    paths.push(p);
  }
  return paths;
}

export async function claudeCall(args: ClaudeCallArgs): Promise<string> {
  const flags: string[] = [
    '--print',
    '--model', MODEL,
    '--output-format', 'text',
    '--max-turns', String(args.maxTurns ?? (args.webSearch ? 8 : 2)),
    '--permission-mode', 'bypassPermissions'
  ];
  if (args.system) flags.push('--append-system-prompt', args.system);
  if (args.webSearch) flags.push('--allowed-tools', 'WebSearch,WebFetch');
  else flags.push('--allowed-tools', 'Read');

  let prompt = args.prompt;
  if (args.pdfAttachments?.length) {
    const paths = await writePdfsToTemp(args.pdfAttachments);
    prompt = `Attached PDFs to read (use the Read tool):\n${paths.map(p => `- ${p}`).join('\n')}\n\n${prompt}`;
    flags[flags.indexOf('Read')] = 'Read,Glob';
  }

  return new Promise<string>((resolve, reject) => {
    const proc = spawn('claude', flags, {
      env: { ...process.env, CLAUDE_CODE_DISABLE_TELEMETRY: '1' }
    });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => (out += d.toString()));
    proc.stderr.on('data', d => (err += d.toString()));
    proc.on('error', e => reject(new Error(`spawn failed: ${e.message}`)));
    proc.on('close', code => {
      if (code === 0) resolve(out);
      else reject(new Error(`claude exited ${code}. stderr: ${err.slice(0, 2000)}`));
    });
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const s = Math.min(
    ...['{', '['].map(c => {
      const i = raw.indexOf(c);
      return i === -1 ? Infinity : i;
    })
  );
  const e = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (!isFinite(s) || e === -1) throw new Error(`No JSON found in output:\n${text.slice(0, 500)}`);
  return JSON.parse(raw.slice(s, e + 1)) as T;
}
