'use client';
import { useState } from 'react';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { Decision, ReviewAnswer, ReviewState } from '@/lib/types';
import { Badge, EvidenceRefs } from './Primitives';
import { euro } from '@/lib/formatting';

export default function DecisionRegister({decisions,materialOnly=false,draft,onUpdate}:{decisions:Decision[];materialOnly?:boolean;draft?:ReviewState;onUpdate?:(id:string,value:ReviewAnswer)=>void}) {
 const [query,setQuery]=useState('');const [filter,setFilter]=useState('all');const [open,setOpen]=useState('');
 const base=materialOnly?decisions.filter(d=>d.type==='material'):decisions;
 const shown=base.filter(d=>{
  const r=draft?.answers[d.id];
  const reviewed=r?r.state!=='needs-review':d.certificationState==='CERTIFIED';
  const match=[d.id,d.category,d.question,d.recommendedAnswer,d.evidence.map(e=>e.id).join(' ')].join(' ').toLowerCase().includes(query.toLowerCase());
  return match&&(filter==='all'||filter===d.type||filter==='low'&&d.confidence==='Low'||filter==='unresolved'&&d.uncertaintyIds.some(x=>x!=='U15')||filter==='disagreements'&&d.agentsDisagree===true||filter==='confidence-differences'&&d.aiComparison?.confidenceDifference||filter==='presentation-differences'&&d.aiComparison?.presentationDifference||filter==='overrides'&&(r?.state==='modified'||d.studentChangedAIAnswer===true)||filter==='pending'&&d.type==='material'&&!reviewed||filter==='reviewed'&&reviewed);
 });
 return <div className="register">
  <div className="register-toolbar"><label className="search"><Search size={17}/><input aria-label="Search decisions" placeholder="Search ID, judgment, evidence…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery('')}>×</button>}</label><label className="filter"><SlidersHorizontal size={16}/><select aria-label="Filter decisions" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All {materialOnly?'material judgments':'decisions'}</option>{!materialOnly&&<><option value="operational">Operational</option><option value="material">Material judgments</option></>}<option value="low">Low confidence</option><option value="unresolved">Evidence gaps</option><option value="disagreements">Accounting disagreements</option><option value="confidence-differences">Agent confidence differences</option><option value="presentation-differences">Presentation differences</option><option value="overrides">Student overrides</option><option value="pending">Review pending</option><option value="reviewed">Personally reviewed</option></select></label><span className="result-count" role="status">{shown.length} / {base.length}</span></div>
  <div className="register-head"><span>Decision ID</span><span>Decision / question</span><span>Confidence</span><span>Review</span></div>
  {shown.length===0&&<div className="empty"><h3>No matching decisions</h3><p>{filter==='disagreements'?'No differences in the primary accounting conclusions were identified between the supplied analyses. Confidence and presentation differences are available in their own filters.':'Try a different search or filter.'}</p><button onClick={()=>{setQuery('');setFilter('all');}}>Clear filters</button></div>}
  {shown.map(d=>{
   const expanded=open===d.id;const r=draft?.answers[d.id];const approved=r?r.state!=='needs-review':d.certificationState==='CERTIFIED';
   return <article className={`decision ${expanded?'expanded':''}`} key={d.id} id={d.id} data-decision-id={d.id}>
    <button className="decision-summary" aria-expanded={expanded} aria-controls={`detail-${d.id}`} onClick={()=>setOpen(expanded?'':d.id)}><span className="decision-id">{d.id}</span><span className="decision-question"><small>{d.category} · {d.type}</small>{d.question}</span><Badge text={d.confidence}/><span className="review-short">{approved?r?.state==='modified'?'Modified':'Approved':d.type==='material'?'Pending':'Recorded'}<ChevronDown size={15}/></span></button>
    {expanded&&<div id={`detail-${d.id}`} className="decision-detail">
     <div className="recommendation"><span className="eyebrow">{approved?'APPROVED ACCOUNTING TREATMENT':'ACCOUNTING TREATMENT'}</span><p>{d.recommendedAnswer}</p></div>
     <p className="formula">{d.calculation}</p>
     {d.type==='material'&&d.agentReviews&&d.aiComparison&&<>
      <div className="agent-grid"><AgentReview title="AGENT 1 · ORIGINAL PROPOSAL" review={d.agentReviews.agent1}/><AgentReview title="AGENT 2 · INDEPENDENT CONCLUSION" review={d.agentReviews.agent2}/></div>
      <div className="comparison"><b>Comparison of the supplied analyses</b><p>{d.comparison}</p><p><b>Accounting disagreement:</b> {d.agentsDisagree?'Yes':'No'} · <b>Difference noted:</b> {d.disagreementType}</p><small>{d.aiComparison.scope}</small>{d.aiComparison.sourceQualification&&<p className="helper"><b>Available-source qualification:</b> {d.aiComparison.sourceQualification}</p>}</div>
     </>}
     <div className="effect"><span className="eyebrow">{d.effect.kind}</span><p><b>Baseline:</b> {d.effect.baseline}</p><div className="effect-grid">{(['profit','cash','assets','liabilities','equity'] as const).map(k=><div key={k}><small>{k}</small><strong>{euro(d.effect[k],true)}</strong></div>)}</div><small>{d.effect.note}</small></div>
     <div className="detail-evidence"><b>Evidence</b><EvidenceRefs sources={d.evidence}/></div><ul className="source-locators">{d.evidence.map((e,i)=><li key={e.id+i}>{e.id} · {e.locator}</li>)}</ul>
     <div className="remaining"><b>Remaining uncertainty</b><p>{d.uncertainty}</p></div>
     {d.type==='material'&&<div className="static-position"><span className="eyebrow">FINAL STUDENT POSITION · {d.certificationState}</span><p>{d.finalPositionStatus}</p><b>{approved?'Approved final position':'Proposed position for approval'}</b><p>{approved?d.finalAnswer:d.proposedStudentPosition}</p><b>{approved?'Reasoning adopted by the student':'Source reasoning for review'}</b><p>{approved?d.studentReasoning:d.proposedReasoning}</p><small>{d.proposedReasoningSource}</small>
      {d.aiComparison&&<><p><b>{approved?'Approved':'Proposed'} accounting conclusion differs from Agent 1:</b> {d.aiComparison.proposedDiffersFromAgent1?'Yes':'No'} · <b>Agent 2:</b> {d.aiComparison.proposedDiffersFromAgent2?'Yes':'No'}</p>{d.aiComparison.presentationDifference&&<p>Presentation differs from Agent 1: the write-off is included in cost of sales, following Agent 2. Operating and corrected profit are unchanged by this presentation choice.</p>}<p><b>Approved final answer differs from either AI:</b> {approved?`Agent 1: ${d.aiComparison.finalDiffersFromAgent1===false?'No':d.aiComparison.finalDiffersFromAgent1===true?'Yes':'comparison required'} · Agent 2: ${d.aiComparison.finalDiffersFromAgent2===false?'No':d.aiComparison.finalDiffersFromAgent2===true?'Yes':'comparison required'} (accounting conclusion; presentation differences are disclosed above).`:'PENDING — no final student approval recorded.'}</p></>}
      {approved&&<p>Explicit personal approval recorded for this material judgment. The existing evidence, statement effect and confidence are retained.</p>}<small>{d.templateMapping}</small></div>}
     {draft&&onUpdate&&<ReviewEditor key={d.id} decision={d} current={r} onSave={value=>onUpdate(d.id,value)}/>}
    </div>}
   </article>;
  })}
 </div>;
}
function AgentReview({title,review}:{title:string;review:NonNullable<Decision['agentReviews']>['agent1']}){
 return <div><span className="eyebrow">{title}</span><p>{review.proposal}</p><p><b>Confidence as stated:</b> {review.confidence}</p><details><summary>Original reasoning, challenge and effects</summary><p><b>Reasoning / strongest evidence</b><br/>{review.reasoningEvidence}</p><p><b>Challenge / alternative</b><br/>{review.challenge}</p><p><b>Statement effect as stated</b><br/>{review.statementEffect}</p><p className="helper">Original effect wording is retained with its own transaction or correction baseline. It is not an additional journal entry.</p>{review.missingEvidence&&<p><b>Missing evidence</b><br/>{review.missingEvidence}</p>}<p><b>What would change the answer</b><br/>{review.changeCondition}</p></details><p><a className="text-link" href={review.sourceUrl} target="_blank" rel="noreferrer">Original analysis · line {review.sourceLine} ↗</a></p></div>;
}
function ReviewEditor({decision:d,current,onSave}:{decision:Decision;current?:ReviewAnswer;onSave:(v:ReviewAnswer)=>void}) {
 const [state,setState]=useState<ReviewAnswer['state']>(current?.state||'needs-review');
 const [answer,setAnswer]=useState(current?.answer||'');const [reason,setReason]=useState(current?.reason||'');
 const [choice,setChoice]=useState(current?.choice||d.choices[0]?.value||'recommended');
 const [notice,setNotice]=useState('');
 function select(next:ReviewAnswer['state']) {setState(next);setNotice('');if(next==='accepted'){setAnswer(d.recommendedAnswer);setChoice(d.choices.find(c=>d.id==='D082'?d.recommendedAnswer.includes(`Displayed basis: ${c.value}`):d.id==='D089'?d.recommendedAnswer.startsWith(`One provision of ${euro(Number(c.value))}`):d.id==='D083'?d.recommendedAnswer.startsWith('Alternative selected')?c.value==='provide':c.value==='no-provision':false)?.value||d.choices[0]?.value||'recommended');}else if(next==='modified'&&!d.choices.length)setChoice('custom');}
 const save=()=>{if(state!=='needs-review'&&(!answer.trim()||!reason.trim())){setNotice('Enter an adopted answer and your own reason before saving.');return;}onSave({state,answer,reason,choice,reviewedAt:new Date().toISOString()});setNotice('Saved to your local draft. The published statements and submission remain unchanged until the reviewed draft is incorporated.');};
 return <div className="review-editor"><span className="eyebrow">YOUR PERSONAL REVIEW · LOCAL DRAFT</span><div className="review-choices">{(['accepted','modified','needs-review'] as const).map(s=><button type="button" key={s} className={state===s?'selected':''} aria-pressed={state===s} onClick={()=>select(s)}>{s==='accepted'?'Accept recommended treatment':s==='modified'?'Modify treatment':'Needs review'}</button>)}</div>
  {state==='modified'&&d.choices.length>0&&<label>Treatment scenario<select aria-label={`Treatment scenario ${d.id}`} value={choice} onChange={e=>setChoice(e.target.value)}>{d.choices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}<option value="custom">Custom treatment — statement revision required</option></select></label>}
  <label>Your adopted answer<textarea aria-label={`Adopted answer ${d.id}`} rows={3} value={answer} readOnly={state==='accepted'} onChange={e=>setAnswer(e.target.value)} placeholder="Accept the recommendation or write your own treatment."/></label>
  <label>Your reasoning<textarea aria-label={`Personal reason ${d.id}`} rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="In your own words: why does the evidence support your decision?"/></label>
  {choice==='custom'&&<p className="helper">Revised treatments are retained for review and must be reflected in the financial statements before final certification.</p>}
  <button className="primary" onClick={save}>Save review for {d.id}</button>{notice&&<p className="save-notice" role="status">{notice}</p>}
 </div>;
}


