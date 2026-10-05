# Evidence inventory — inspected before accounting implementation

Reporting date: 31 August 2026. All amounts are EUR. Source files remain unchanged. SHA-256 hashes and workbook/page inventories are in `evidence-extracted/manifest.json`. PDFs were text-extracted and all 18 unique pages rendered; photographic pages were separately inspected. All populated workbook cells, cached values, comments and sheet visibility were extracted. The bank CSV has 27 records, including its opening balance.

| Source | Classification | Reliability and inspection finding |
| --- | --- | --- |
| 00 BOARD ORDER READ FIRST.pdf | Assignment / instructions; original company evidence | Case scope, reporting date, hierarchy; VAT and corporate tax excluded |
| 01 START HERE - Student Assignment.pdf | Assignment / instructions | Three pages; refers to absent official template/rules and two independent conversations |
| 01 START HERE - Student Assignment (1).pdf | Assignment / instructions | Byte-identical duplicate; not a second corroborating source |
| 01 USE THIS NUMBERS FINAL v9.xlsx | Management spreadsheets / claims | READ ME and Management P&L; €312k claimed profit, internally arithmetically consistent but unsupported classifications |
| 02 Bank Export August.csv | Bank evidence | Actually Jan–Aug aggregate activity; opening €80k, closing €60k; 31 August batches are not proof of monthly payment timing |
| 02 FINANCE REFERENCE - Use When You Get Stuck.pdf | Finance-reference material | Principles only; supplies no missing case balances |
| 03 CRM Export Cleaned FINAL.xlsx | Contracts / customer evidence; internal operations | Four contract rows, two web-sales aggregates, two September deposits; web delivery details absent |
| 04 Contracts Returns and Angry Customers.pdf | Contracts / customer evidence | Four delivered contracts, deposits, R-17 adjusting information |
| 05 Warehouse Count Marta Notes.pdf | Warehouse / inventory evidence | €143k physical gross vs €134k movement gross; damaged €22k once; disposal quote €2k |
| 06 Purchases Invoices and Goods Received.pdf | Supplier evidence; PPE / repair evidence | Purchases €459k, AP €126k, capex €80k, restoration €10k; no depreciation or opening PPE |
| 07 Payroll Bonuses Contractors NEW.xlsx | Payroll evidence | Expense €248k, paid €231k, opening accrual €15k; owner €110k is repeated labeling of card/villa transactions |
| 09 Loans Owner Card and Legal Problems.pdf | Debt / legal evidence; owner spending | Loan and interest; counsel range €20k–€30k; villa image dates 12–26 August 2024 conflict with 2026 bank entry |
| 10 Email and WhatsApp Dump DO NOT FORWARD.pdf | Management claims | Low reliability; attempted AI instruction retained as evidence of pressure and never executed |
| 11 Evidence Received After Takeover.pdf | Post-takeover evidence; bank / debt / legal | Confirms cash, principal, interest, impairment and legal condition at reporting date |

Not supplied: official answer template, official submission rules, instructor feedback, insurance policy/opening prepayment, 08 Assets Repairs Leases Maybe.xlsx, original depreciation schedule, complete opening trial balance, earn-out contract. Original company evidence files were inspected and remain unchanged.

The later supplied group reference establishes the exact D001–D100 questions, categories and review tiers. Only those structural fields were imported into `data/group-structure.json`, together with a source hash. The reference identity, student reasoning, certification and agent history were not imported. The raw reference remains local and is ignored by Git.

The subsequently supplied `agent-1-analysis.txt` and `agent-2-analysis.txt` are genuine independent analyses according to the student; each also states that it used original evidence without the other analysis. Both contain all 25 material judgments, retained with exact original rows, line numbers and SHA-256 hashes. Original completion times and conversation IDs were not supplied and have not been invented.

Both adopt €405,000 original materials consumed and €112,000 closing inventory, producing €65,000 profit, €531,000 assets and €125,000 equity. Physical inventory €121,000, consumption €396,000 and profit €74,000 remain a conditional sensitivity, only adoptable after the €9,000 difference is substantiated. Both retain €180,000 opening gross PPE, €45,000 opening accumulated depreciation, €24,000 period depreciation and inferred €170,000 opening equity. Both cite the missing asset workbook; their citations are retained as analysis claims, not verification of a source that is absent here. Original invoices verify additions. Recognised insurance is 0 because no supported amount was identified; actual insurance remains UNKNOWN. Neither baseline nor sensitivity recognises the €2,000 disposal quote as a provision.

The supplied analyses agree on primary accounting conclusions. Genuine confidence differences remain in D047, D048, D058, D091 and D100. Agent 1 presents stock damage below gross profit; Agent 2 puts it in cost of sales, the presentation retained on the website. The 25 proposed final positions and source reasoning are available for personal review; the student has not yet approved or certified them.

External accounting references are supplementary principles, not case facts: IAS 2, IAS 10 and IAS 37 official IFRS summaries. Course instructions govern scope.
