/**
 * Check web/lib/hash.mjs against the shared vectors in tests/vectors.json.
 *
 *   node scripts/check-vectors.mjs
 *
 * The contract hashes with hashlib, the browser with SubtleCrypto. Both must
 * give the same bytes, or a side could seal an account that can never be
 * opened. tests/test_static.py runs this script.
 */
import fs from 'node:fs';
import path from 'node:path';

import { sealOf } from '../lib/hash.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const vectors = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'vectors.json'), 'utf8'));
const problems = [];
for (const v of vectors.seals) {
  const got = await sealOf(v.text, v.salt, v.address);
  if (got !== v.seal) problems.push(`seal of ${JSON.stringify(v.text.slice(0, 40))}: ${got} != ${v.seal}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`vectors ok: ${vectors.seals.length} seals`);
