# Group-mapped internal submission structure

This is implementation documentation, **not** an official course schema. The official answer template and submission rules were not found in the project.

`buildSubmission()` in `lib/submission.ts` is the sole export constructor. Both website routes and the statically generated `/submission.json` consume its result. There is no manually maintained public JSON copy.

| Field | Meaning |
| --- | --- |
| `schemaVersion`, `templateStatus` | Explicit provisional status and missing official filenames |
| `caseId`, `company`, `reportingDate`, `currency`, `units` | Case identity; monetary values are EUR, not cents |
| `student`, `certification` | Artūrs Losevs, al25174; Student Certification COMPLETE, with 25 explicit material approvals |
| `metrics` | Primary baseline calculations; `adjustments` contains unique economic event IDs; `physicalCountAlternative` holds the conditional, unrecognised sensitivity |
| `financialStatements` | Adopted P&L, direct cash flow and balance sheet with explicit assumptions and unknown exposures |
| `supportingSchedules` | Eight schedules with source locators, formulas and evidence status |
| `reconciliations` | Separate `arithmeticStatus` and `evidenceStatus`, difference, explanation and uncertainty links |
| `decisions` | Exact group-reference structure, primary answers, evidence and effects; material rows also include both original `agentReviews`, `aiComparison`, approved student positions and adopted source reasoning |
| `decisionStructure` | Source hash, preserved fields and confirmation that personal content was not imported |
| `uncertainties` | Area, known evidence, confidence in treatment, missing evidence/follow-up and potential statement effect |
| `evidenceSummary` | Source filenames, links, hashes, reliability and duplicate identification |
| `aiReviewTrail` | Both supplied analyses, original row/line/hash provenance, subsequent comparison and 25 populated material judgments; no invented completion times or conversation IDs |
| `boardRecommendation` | Current conclusion, qualifications and immediate control actions |

Amounts are numbers or the explicit strings `UNKNOWN` and `N/A`. Actual unknowns are not factual zeros. Insurance recognised at 0 is a deliberate no-supported-amount treatment; `insuranceActualAmount` stays `UNKNOWN`. `metrics.adoptedBasis` records the user-instructed opening PPE, depreciation and equity assumptions separately from original source facts. `effect.baseline` specifies the comparison for each material judgment. `adjustmentIds` links repeated decisions to one event in `metrics.adjustments`; effects are not additive and never generate the accounts.

The supplied group-reference structure is already preserved exactly, including its non-sequential 25 material judgments. When official files arrive, compare and validate them separately; adapt the export constructor if necessary without silently replacing the group questions or review provenance.

Agent confidence and effect wording is preserved separately from the report’s confidence and explicit comparison baseline. `agentsDisagree` addresses the primary accounting conclusion; confidence, challenge and presentation differences are separate. `proposedDiffersFromAgent1/2` concerns the proposed accounting amount/treatment. Presentation differences have separate flags. `finalDiffersFromAgent1/2` now records the comparison with each approved final accounting position. Existing source reasoning is adopted by explicit student approval while its original attribution is preserved; no new student-authored rationale is fabricated.

Student Certification COMPLETE records explicit approval of the 25 material judgments and is independent of official course-schema validation. The 75 operational decisions remain recorded without a separate personal attestation. Technical checks and personal certification do not verify missing evidence or resolve the open inventory conflict.
