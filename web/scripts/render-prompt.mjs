/**
 * Print the judge prompt lib/judge.mjs builds for a JSON case on stdin, so
 * tests/test_static.py can compare it with the contract's judge_prompt().
 *
 *   echo '{"title": "...", "a": "...", "b": "..."}' | node scripts/render-prompt.mjs
 */
import { judgePrompt } from '../lib/judge.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const c = JSON.parse(input);
process.stdout.write(judgePrompt(c.title, c.a, c.b));
