import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateReviewImport } from '../lib/validation';
const path=process.argv[2];
if(!path)throw new Error('Usage: npm run review:import -- path/to/review-draft.json');
const value=JSON.parse(readFileSync(resolve(path),'utf8').replace(/^\uFEFF/,''));
const submission=validateReviewImport(value);
writeFileSync(resolve('data/reviewed-state.json'),JSON.stringify(value,null,2)+'\n');
console.log(`Persisted ${submission.certification.status}. Rebuild and restart to publish the SAME static state at /, /review and /submission.json. ${submission.certification.blockers.length} certification blockers remain.`);
