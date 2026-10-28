import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const ignore = new Set(['node_modules', '.next', '.git', '.vercel', '.vs', 'coverage', 'artifacts']);
const failures = [];
try { process.loadEnvFile('.env.local'); } catch {}
const privateKey = process.env.QLOO_API_KEY?.trim();
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignore.has(entry.name) || (entry.name.startsWith('.env') && entry.name !== '.env.local.example')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(full);
    else if (/\.(tsx?|[cm]?js|json|md|ya?ml|example)$/.test(entry.name)) {
      const text = await readFile(full, 'utf8');
      if (/hack_[a-zA-Z0-9]{20,}/.test(text) || /sk-(?:proj-)?[a-zA-Z0-9_-]{25,}/.test(text)) failures.push(path.relative(root, full));
      if (privateKey && text.includes(privateKey)) failures.push(`Private credential in ${path.relative(root, full)}`);
    }
  }
}
await scan(root);
try { await scan(path.join(root, '.next', 'static')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const required of ['LICENSE', 'README.md', '.env.local.example', 'docs/SUBMISSION.md', 'vercel.json']) {
  try { await readFile(path.join(root, required)); } catch { failures.push(`Missing ${required}`); }
}
if (failures.length) { console.error('Release check failed (values hidden):\n' + failures.join('\n')); process.exitCode = 1; }
else console.log('Release source scan passed. Required documents present; no recognized API-key literals found.');
