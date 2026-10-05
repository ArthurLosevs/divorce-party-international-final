import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readBuiltSubmission,validateBuiltSubmission} from '../scripts/validate-build.mjs';

const s=readBuiltSubmission();
const a=s.metrics;
const fs=s.financialStatements;
const line=(statement,id)=>statement.lines.find(r=>r.id===id);

test('100 unique decisions and complete internal schema',()=>validateBuiltSubmission(s));
test('the raw bank CSV agrees with the model, excluding the opening credit from receipts',()=>{
  const rows=readFileSync('02 Bank Export August.csv','utf8').trim().split(/\r?\n/).slice(1).map(row=>{
    const fields=row.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g).slice(0,-1).map(v=>v.replace(/,$/,''));
    return {reference:fields[1],debit:Number(fields[3]||0),credit:Number(fields[4]||0),balance:Number(fields[5])};
  });
  assert.equal(rows.length,27);
  let balance=rows[0].balance;
  for(const r of rows.slice(1)){balance+=r.credit-r.debit;assert.equal(balance,r.balance);}
  assert.equal(balance,a.closingCash);
  assert.equal(rows.slice(1).reduce((sum,r)=>sum+r.credit-r.debit,0),a.cfo+a.cfi+a.cff);
  assert.equal(rows.find(r=>r.reference==='PAYROLL').debit,a.payrollCash);
  assert.equal(a.distributions,rows.filter(r=>['VILLA','OWNERCARD'].includes(r.reference)).reduce((sum,r)=>sum+r.debit,0));
});
test('revenue and payroll reproduce workbook cells',()=>{
  const workbook=file=>JSON.parse(readFileSync(`evidence-extracted/${file}.json`,'utf8'));
  const cell=(s,address)=>s.rows.flat().find(c=>c.cell===address).value;
  const crm=workbook('03 CRM Export Cleaned FINAL')[0];
  const payroll=workbook('07 Payroll Bonuses Contractors NEW')[0];
  assert.equal(a.revenue,[4,5,6,7,8,9].reduce((sum,row)=>sum+cell(crm,`E${row}`),0));
  assert.equal(a.customerReceipts,[4,5,6,7,8,9].reduce((sum,row)=>sum+cell(crm,`F${row}`),0));
  assert.equal(a.deposits,cell(crm,'F10')+cell(crm,'F11'));
  assert.equal(a.payrollExpense,cell(payroll,'B7'));
  assert.equal(a.payrollCash,cell(payroll,'C7'));
  assert.equal(a.payrollClosing,15000+cell(payroll,'B7')-cell(payroll,'C7'));
});
test('one expense for each impairment and provision; owner effects are not additive',()=>{
  assert.equal(line(fs.profitAndLoss,'stock-impairment').amount,-22000);
  assert.equal(line(fs.profitAndLoss,'bad-debt').amount,-18000);
  assert.equal(line(fs.profitAndLoss,'legal').amount,-25000);
  assert.equal(a.knownResult,960000-405000-248000-22000-141000-24000-18000-25000-12000);
  assert.equal(a.movementInventory,80000+459000-405000-22000);
  assert.equal(a.physicalInventory,79000+42000);
  const owner=s.decisions.find(d=>d.id==='D047');
  assert.equal(owner.effect.cash,0);assert.equal(owner.effect.equity,0);
  assert.deepEqual(owner.adjustmentIds,s.decisions.find(d=>d.id==='D046').adjustmentIds);
});
test('unknowns and qualifications remain visible despite arithmetic agreement',()=>{
  assert.equal(fs.profitAndLoss.finalProfit,65000);
  assert.equal(line(fs.balanceSheet,'ppe').amount,191000);
  assert.equal(line(fs.balanceSheet,'assets-total').amount,531000);
  assert.equal(line(fs.balanceSheet,'equity').amount,125000);
  assert.equal(fs.profitAndLoss.insuranceActualAmount,'UNKNOWN');
  const ap=s.reconciliations.find(r=>r.id==='ap');
  assert.equal(ap.arithmeticStatus,'PASS');assert.equal(ap.evidenceStatus,'QUALIFIED');
  assert.equal(s.reconciliations.find(r=>r.id==='inventory-conflict').difference,9000);
  assert.match(s.uncertainties.find(u=>u.id==='U08').knownEvidence,/2024.*2024/);
});
test('source downloads match original evidence SHA-256; explicit material approval is accurately scoped',()=>{
  for(const e of s.evidenceSummary.files){
    for(const file of [e.file,`public/evidence/${e.file}`])assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),e.sha256,file);
  }
  assert.equal(s.aiReviewTrail.agent1.status,'COMPLETE');assert.equal(s.aiReviewTrail.agent2.status,'COMPLETE');
  assert.equal(s.certification.status,'COMPLETE');
  assert.equal(s.certification.materialReviewed,25);
  const saved=JSON.parse(readFileSync('data/reviewed-state.json','utf8'));
  assert.equal(saved.status,'COMPLETE');assert.equal(saved.acknowledged,true);
  assert.deepEqual(s.certification.answers,saved.answers);
  assert.equal(s.certification.timestamp,saved.certifiedAt);
  assert.equal(saved.operationalAttestation,false);
  for(const d of s.decisions.filter(d=>d.type==='material')){
    assert.equal(d.certificationState,'CERTIFIED');assert.equal(d.finalPositionStatus,'APPROVED / CERTIFIED');
    assert.equal(d.finalAnswer,d.recommendedAnswer);assert.equal(d.studentReasoning,d.agentReviews.agent1.reasoningEvidence);
  }
  assert.equal(s.uncertainties.find(u=>u.id==='U15').status,'RESOLVED');
  assert.equal(s.uncertainties.find(u=>u.id==='U01').status,'OPEN');
  assert.equal(s.templateStatus.officialSchemaVerified,false);
});
test('both original analyses and all 25 rows, confidence and effect texts are preserved exactly',()=>{
  const clean=value=>value.replaceAll('**','').replaceAll('`','').trim();
  for(const [index,key] of ['agent1','agent2'].entries()){
    const agent=s.aiReviewTrail[key],bytes=readFileSync(agent.artifactPath),rows=bytes.toString('utf8').split(/\r?\n/);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),agent.sha256);
    assert.deepEqual(readFileSync(`public${agent.url}`),bytes);
    assert.equal(Object.keys(agent.positions).length,25);
    for(const [id,p] of Object.entries(agent.positions)){
      assert.equal(rows[p.sourceLine-1],p.sourceText);
      const cells=p.sourceText.split('|').slice(1,-1).map(clean);
      assert.equal(cells[0],id);assert.equal(cells[1],p.proposal);assert.equal(cells[2],p.reasoningEvidence);
      assert.equal(cells[index===0?3:4],p.statementEffect);assert.equal(cells[index===0?4:5],p.confidence);
      assert.equal(cells[index===0?5:3],p.challenge);
    }
    assert.equal(agent.completedAt,'','Original completion time was not supplied');
    assert.equal(agent.conversationId,'','Do not invent conversation IDs');
  }
  const card=s.decisions.find(d=>d.id==='D047');
  assert.equal(card.agentReviews.agent1.confidence,'High');assert.equal(card.agentReviews.agent2.confidence,'Medium');
  assert.equal(card.agentsDisagree,false);assert.equal(card.aiComparison.confidenceDifference,true);
  assert.ok(s.decisions.find(d=>d.id==='D058').aiComparison.presentationDifference);
});
test('physical-count sensitivity cannot be mistaken for recognised inventory or a disposal provision',()=>{
  const alt=a.physicalCountAlternative;
  assert.equal(a.inventory,112000);assert.equal(a.materialsUsed,405000);
  assert.equal(alt.inventory,121000);assert.equal(alt.materialsUsed,396000);
  assert.equal(alt.correctedProfit,74000);assert.equal(alt.adopted,false);
  assert.equal(alt.totalAssets-a.totalAssets,9000);assert.equal(alt.closingEquity-a.closingEquity,9000);
  assert.equal(a.disposalProvision,0);assert.equal(alt.disposalProvision,0);
  for(const r of s.reconciliations)assert.equal(r.difference,r.id==='inventory-conflict'?9000:0,r.id);
  const accidentalAdoption=structuredClone(s);accidentalAdoption.metrics.physicalCountAlternative.adopted=true;assert.throws(()=>validateBuiltSubmission(accidentalAdoption));
  const inventedDisagreement=structuredClone(s);inventedDisagreement.decisions.find(d=>d.id==='D047').agentsDisagree=true;assert.throws(()=>validateBuiltSubmission(inventedDisagreement));
});
test('built main and assessor HTML use the same headlines and every decision ID',()=>{
  for(const file of ['index.html','review.html']){
    const html=readFileSync(`.next/server/app/${file}`,'utf8');
    for(const d of s.decisions)assert.ok(html.includes(`data-decision-id="${d.id}"`));
    for(const n of [a.knownResult,a.closingCash,a.totalAssets,a.closingEquity])assert.ok(html.includes(new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n)));
    assert.ok(html.includes('Artūrs Losevs')&&html.includes('al25174'));
    assert.ok(html.includes('Student Certification')&&html.includes('COMPLETE'));
    assert.ok(!/Personal approval pending|personal student approval remains pending|Personal certification PENDING|Student certification PENDING|Pending personal review/.test(html));
    assert.equal((html.match(/class="review-short">Approved/g)||[]).length,25);
    assert.ok(!/Muižniece|em25177|Ērika|€89,000/.test(html));
  }
});
test('certification validation rejects missing approval, changed approved treatment and invented operational review',()=>{
  const missing=structuredClone(s);delete missing.certification.answers.D041;assert.throws(()=>validateBuiltSubmission(missing));
  const changed=structuredClone(s);changed.decisions.find(d=>d.id==='D075').finalAnswer='Adopt physical inventory';assert.throws(()=>validateBuiltSubmission(changed));
  const pending=structuredClone(s);pending.certification.materialReviewed=24;assert.throws(()=>validateBuiltSubmission(pending));
  const operational=structuredClone(s);operational.decisions[0].certificationState='CERTIFIED';assert.throws(()=>validateBuiltSubmission(operational));
});
test('validator rejects duplicated decisions, factual-zero insurance and duplicated adjustment references',()=>{
  const duplicate=structuredClone(s);duplicate.decisions[99]=duplicate.decisions[98];assert.throws(()=>validateBuiltSubmission(duplicate));
  const zero=structuredClone(s);zero.financialStatements.profitAndLoss.insuranceActualAmount=0;assert.throws(()=>validateBuiltSubmission(zero));
  const event=structuredClone(s);event.decisions[56].adjustmentIds.push('AJ_BAD_DEBT');assert.throws(()=>validateBuiltSubmission(event));
});
