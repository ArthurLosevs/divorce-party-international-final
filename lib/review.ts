import { analyses } from '@/data/analyses';
import { modelVersion } from '@/data/assumptions';
import structure from '@/data/group-structure.json';
import type { Decision, ReviewState } from './types';

export function reviewCount(state:ReviewState,ids:string[]) {return ids.filter(id=>{const r=state.answers[id];return r&&r.state!=='needs-review'&&r.answer.trim()&&r.reason.trim()&&Number.isFinite(Date.parse(r.reviewedAt));}).length;}
export function independenceComplete() {
 const ids=structure.decisions.filter(d=>d.reviewTier==='material_judgment').map(d=>d.id);
 const {agent1:a,agent2:b}=analyses;
 return [a,b].every(x=>x.status==='COMPLETE'&&x.originalEvidenceOnly&&x.didNotSeeOtherAnalysis&&x.independenceBasis&&x.artifactPath&&/^[a-f0-9]{64}$/i.test(x.sha256)&&ids.every(id=>x.positions[id]?.proposal.trim()&&x.positions[id]?.sourceText.trim()))
  &&a.sha256!==b.sha256&&a.artifactPath!==b.artifactPath&&Number.isFinite(Date.parse(analyses.comparedAt))
  &&ids.every(id=>analyses.comparisons[id]?.text.trim());
}
export function certificationBlockers(state:ReviewState,decisions:Decision[]):string[] {
 const problems:string[]=[];
 if(state.modelVersion!==modelVersion) problems.push('Review was made against another model version; re-review the changed accounting.');
 if(!state.student.name.trim()||!state.student.id.trim()) problems.push('Enter your name and student ID.');
 const material=decisions.filter(d=>d.type==='material');
 const count=reviewCount(state,material.map(d=>d.id));
 if(count!==25) problems.push(`Personally review and approve all 25 material judgments and their reasoning (${count}/25 complete).`);
 if(!state.acknowledged) problems.push('Explicit student approval and certification are required.');
 if(!independenceComplete()) problems.push('Both genuine independent analyses and the subsequent comparison are pending.');
 // Personal certification covers the 25 material judgments. Course-schema
 // validation and any separate operational attestation retain their own status.
 for(const d of decisions){const r=state.answers[d.id];if(r?.state==='accepted'&&r.answer!==d.recommendedAnswer)problems.push(`${d.id}: approved answer differs from the current model; re-review is required.`);if(r?.state==='modified'&&r.choice==='custom')problems.push(`${d.id}: custom treatment must be mapped into the canonical calculations before final certification.`);}
 return problems;
}
export function validateReviewShape(value:unknown): asserts value is ReviewState {
 if(!value||typeof value!=='object')throw new Error('Review must be an object.');
 const s=value as ReviewState;
 if(s.version!==1||s.modelVersion!==modelVersion)throw new Error('Review format/model version mismatch.');
 if(typeof s.student?.name!=='string'||typeof s.student?.id!=='string'||!s.answers||typeof s.answers!=='object'||Array.isArray(s.answers))throw new Error('Student and answer fields are invalid.');
 for(const flag of ['operationalAttestation','acknowledged'] as const)if(typeof s[flag]!=='boolean')throw new Error(`Invalid ${flag}`);
 if(!['PERSONAL REVIEW PENDING','CERTIFIED','COMPLETE'].includes(s.status)||typeof s.certifiedAt!=='string')throw new Error('Invalid certification status.');
 for(const [id,r] of Object.entries(s.answers)) {
  if(!/^D(00[1-9]|0[1-9][0-9]|100)$/.test(id)||!r||!['accepted','modified','needs-review'].includes(r.state))throw new Error(`Invalid answer ${id}`);
  if(['answer','reason','choice','reviewedAt'].some(key=>typeof r[key as keyof typeof r]!=='string'))throw new Error(`Invalid answer fields ${id}`);
  if(r.state!=='needs-review'&&(!r.answer.trim()||!r.reason.trim()||!Number.isFinite(Date.parse(r.reviewedAt))))throw new Error(`Review answer, personal reason and timestamp required for ${id}`);
 }
}
