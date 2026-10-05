import { buildSubmission } from '../lib/submission';
import { validateSubmission } from '../lib/validation';
const final=process.argv.includes('--final');
const s=buildSubmission();
const errors=validateSubmission(s,final);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Validated ${s.decisions.length} provisional decisions, 75/25 split, arithmetic, source consistency, EUR units and certification integrity. Official schema remains pending.`);
