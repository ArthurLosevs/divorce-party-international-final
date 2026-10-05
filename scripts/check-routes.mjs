import assert from 'node:assert/strict';
import {validateBuiltSubmission} from './validate-build.mjs';
const base=process.argv[2]||'http://127.0.0.1:3000';
const results=await Promise.all(['/', '/review', '/submission.json'].map(async path=>{
 const response=await fetch(new URL(path,base));assert.equal(response.status,200,path);
 const body=await response.text();
 if(path==='/submission.json'){assert.match(response.headers.get('content-type'),/application\/json/);validateBuiltSubmission(JSON.parse(body));}
 else {assert.match(body,/DPI-HT-01/);assert.equal((body.match(/data-decision-id="D\d{3}"/g)||[]).length,100);assert.equal((body.match(/class="review-short">Approved/g)||[]).length,25);assert.match(body,/Student Certification/);assert.match(body,/COMPLETE/);assert.doesNotMatch(body,/Personal approval pending|personal student approval remains pending|Personal certification PENDING|Student certification PENDING|Pending personal review/);}
 return `PASS ${path}`;
}));
console.log(results.join('\n'));
