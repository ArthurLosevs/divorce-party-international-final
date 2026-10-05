import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Import the supplied analyses without inventing missing dates, chat IDs or source evidence.
const structure=JSON.parse(readFileSync('data/group-structure.json','utf8'));
const ids=structure.decisions.filter(d=>d.reviewTier==='material_judgment').map(d=>d.id);
const clean=text=>text.replaceAll('**','').replaceAll('`','').trim();
mkdirSync('public/analyses',{recursive:true});
function importAnalysis(number){
 const file=`agent-${number}-analysis.txt`;
 const bytes=readFileSync(file),raw=bytes.toString('utf8');
 const sha256=createHash('sha256').update(bytes).digest('hex');
 const positions={};
 raw.split(/\r?\n/).forEach((line,index)=>{
  if(!/^\| \*\*D\d{3}\*\* \|/.test(line))return;
  const cells=line.split('|').slice(1,-1).map(clean);
  assert.equal(cells.length,number===1?6:8,`Unexpected table shape: ${file}:${index+1}`);
  const [id,proposal]=cells;
  assert.ok(ids.includes(id)&&!positions[id],`Unexpected/duplicate ${id}`);
  positions[id]={proposal,
   reasoningEvidence:cells[2],
   challenge:number===1?cells[5]:cells[3],
   statementEffect:number===1?cells[3]:cells[4],
   confidence:number===1?cells[4]:cells[5],
   missingEvidence:number===1?'':cells[6],
   changeCondition:number===1?cells[5]:cells[7],
   sourceLine:index+1,sourceText:line,
  };
 });
 assert.deepEqual(Object.keys(positions),ids,`${file}: all 25 material IDs in the expected order`);
 copyFileSync(file,`public/analyses/${file}`);
 return {status:'COMPLETE',conversationId:'',completedAt:'',originalEvidenceOnly:true,didNotSeeOtherAnalysis:true,
  independenceBasis:'Confirmed by the student and stated in the supplied analysis. Separate conversation metadata and original completion time were not supplied.',
  artifactPath:file,url:`/analyses/${file}`,sha256,positions};
}
const agent1=importAnalysis(1),agent2=importAnalysis(2);
const specific={
 D043:'Both capitalise €60,000. Agent 2 expressly tests control, ownership and possible lease/service classification; Agent 1 also requires ownership/control and continuing benefit.',
 D044:'Both capitalise €20,000. Agent 2 explicitly challenges whether this was a short-lived campaign item; Agent 1 challenges continuing ownership/control and benefit.',
 D046:'Both adopt a €70,000 distribution at High confidence. Agent 1 considers an enforceable founder receivable; Agent 2 emphasises business purpose, company rights and refundability.',
 D047:'Both adopt a €40,000 distribution. Agent 1 states High confidence; Agent 2 states Medium and specifically challenges whether receipts could prove business costs or approved remuneration.',
 D048:'Both retain €405,000 materials consumed. Agent 1 separates High classification confidence from Medium inventory-reconciliation confidence; Agent 2 states Medium and expressly identifies €396,000 as the conditional count-derived alternative.',
 D049:'Both classify €80,000 event payroll in cost of sales. Agent 2 distinguishes €75,000 departmental cash and a €5,000 current-period unpaid difference before any opening-accrual allocation; Agent 1 refers to aggregate payroll cash. This is different detail, not an additional expense.',
 D056:'Both adopt €24,000 depreciation at Medium confidence. Both cite an asset-workbook estimate and require the underlying schedule; that workbook is absent from the current project evidence.',
 D058:'Both write down €22,000 and do not recognise the €2,000 disposal quote without an obligation. Agent 1 states High confidence; Agent 2 distinguishes High on the write-down and Medium on disposal non-recognition. In their P&Ls, Agent 1 presents damage below gross profit and Agent 2 includes it in cost of sales. Operating and net profit agree.',
 D064:'Both recognise €180,000 revenue at High confidence. Agent 2 additionally identifies customer-name variations as a matching risk.',
 D066:'Both recognise €100,000 revenue and €30,000 receivable at High confidence. Agent 2 notes that email acceptance is less formal than signed paper.',
 D071:'Both recognise one €18,000 loss. Agent 2 distinguishes an allowance from a direct write-off; net receivables and profit are identical. Agent 1 explicitly links the amount to D057 to avoid a second charge.',
 D072:'Both use the same €22,000 write-off at High confidence and keep the €2,000 disposal quote separate. Their P&Ls differ only in whether damage is in cost of sales or below gross profit; the website retains Agent 2’s cost-of-sales presentation, with the same operating and net profit.',
 D074:'Both adopt €24,000 depreciation at Medium confidence. Agent 1 says the amount would be UNKNOWN rather than zero if the stated estimate proved unreliable; Agent 2 stresses that it cannot be independently recomputed without the asset schedule.',
 D075:'Both adopt €112,000 inventory at Medium confidence and retain €121,000 as a conditional alternative. Agent 1 describes the possible €9,000 increase; Agent 2 describes the same difference as the baseline being €9,000 lower.',
 D091:'Both recommend a provisional corrected baseline before valuation. Agent 1 states High confidence; Agent 2 distinguishes High for rejecting management accounts and Medium-High for baseline approval.',
 D100:'Both reject €312,000 management profit and identify €65,000 corrected profit. Agent 1 states High confidence while noting that the actual earn-out amount is UNKNOWN; Agent 2 distinguishes High on rejection from Medium on the final contractual metric.',
};
const comparisons=Object.fromEntries(ids.map(id=>{
 const first=agent1.positions[id],second=agent2.positions[id];
 const confidenceDifference=first.confidence!==second.confidence;
 const presentationDifference=['D058','D072'].includes(id);
 const type=presentationDifference?'PRESENTATION':confidenceDifference?'CONFIDENCE':specific[id]?'CHALLENGE / DETAIL':'NO ACCOUNTING DISAGREEMENT';
 const sourceQualification=['D043','D044','D056','D074'].includes(id)
  ?'The source analysis refers to the asset workbook or Assets cells. That workbook is not present among the original files in this project. The quotation is retained as the agent’s statement, not independent verification of the missing source.'
  :id==='D046'?'Both agents support a distribution; their rows do not discuss the villa photograph’s 2024 dates. The original-document date conflict remains disclosed in U08.'
  :'';
 return [id,{text:specific[id]||'Both analyses reach the same accounting conclusion and state High confidence. Their original reasoning, alternatives and evidence are preserved separately below.',
  disagree:false,type,confidenceDifference,presentationDifference,
  proposedDiffersFromAgent1:false,proposedDiffersFromAgent2:false,
  proposedPresentationDiffersFromAgent1:presentationDifference,proposedPresentationDiffersFromAgent2:false,
  scope:'Accounting conclusion and amount; confidence, presentation and challenge emphasis are compared separately.',
  sourceQualification,
 }];
}));
writeFileSync('data/analyses.json',JSON.stringify({agent1,agent2,comparedAt:new Date().toISOString(),comparisons},null,2)+'\n');
console.log('Imported 25 original positions per agent, retained exact source rows and SHA-256 hashes, and recorded genuine confidence/presentation differences.');
