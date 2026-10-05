# Divorce Party International Ltd. — DPI-HT-01

Managerial Accounting case website for **Artūrs Losevs (al25174)**, reporting date **31 August 2026**. A normal Next.js website with static case data, public evidence downloads and no login, database or external API. All three public routes are prerendered during the production build.

## Run locally

Install Node.js 22.15+ (Node 24 recommended) and pnpm 11.19.0, then run from this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:3000`. Production preview:

```sh
pnpm build
pnpm test
pnpm start
```

In another terminal, `pnpm test:routes` checks `/`, `/review` and `/submission.json`. For another origin, use `pnpm test:routes http://127.0.0.1:3001`. `pnpm typecheck` checks TypeScript. The build runs a standard Node validation script against the actual prerendered JSON; no operating-system user lookup is needed.

## GitHub

Create an empty **public** repository named `divorce-party-international` on GitHub, without a generated README. In this folder:

```sh
git init -b main
git add .
git commit -m "Build DPI accounting case website"
git remote add origin https://github.com/YOUR_USERNAME/divorce-party-international.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. The repository includes the supplied fictional case evidence. The ignore file excludes dependencies, local package stores, build output, environment files and temporary previews.

## Vercel

1. In Vercel choose **Add New → Project**, then import the GitHub repository.
2. Select the **Next.js** framework preset, root directory `./`, Node.js **24.x**, install command `pnpm install --frozen-lockfile`, and build command `pnpm build`. Leave the output directory at the Next.js default.
3. Deploy. No environment variables, database or paid API are required.
4. Open the production URL in a private browser window and check `/`, `/review`, `/submission.json`. Ensure the production deployment is publicly accessible without a Vercel login before submitting its URL.

Reference: [Vercel's Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs).

## Accounting and evidence status

The site preserves all 100 IDs, questions, categories and review tiers from the supplied group reference: **75 operational and 25 material judgments**. The material IDs are D041–D049, D056–D059, D064–D068, D071–D075, D091 and D100. The sanitized structure in `data/group-structure.json` excludes the other student's identity and personal history. The raw group reference is ignored by Git. Both genuine supplied analyses are populated for all 25 material judgments; **Student Certification is COMPLETE** following Artūrs Losevs’s explicit approval of all 25 material positions on 5 October 2026. Their existing reasoning, evidence, financial effects and confidence are preserved. Personal certification does not resolve the €9,000 inventory conflict or verify missing evidence or the official course schema.

The primary baseline agreed by both independent analyses produces **€65,000 corrected profit**, €77,000 operating profit, €60,000 cash, €531,000 assets, €406,000 liabilities and €125,000 equity. It retains original materials consumed €405,000 and closing inventory €112,000 after one €22,000 write-off. Cost of sales is €507,000 including €80,000 event payroll and the write-off. The unresolved physical count exceeds the roll-forward by €9,000; no balancing entry is posted.

The physical-count model is **sensitivity only**: inventory €121,000, materials consumed €396,000, profit €74,000, assets €540,000 and equity €134,000. It would be adopted only if additional reconciliation evidence substantiates the difference and lower consumption. Both scenarios recognise no €2,000 disposal provision without an established obligation. PPE cost is €180,000 + €60,000 + €20,000 = €260,000; accumulated depreciation is €45,000 + €24,000 = €69,000; net PPE is €191,000.

Missing files: `01 GIVE TO CODEX - Answer Template.json`, `02 GIVE TO CODEX - Submission Rules.json`, and `08 Assets Repairs Leases Maybe.xlsx`. Official export-schema compliance remains unverified. Opening PPE, depreciation and €170,000 opening equity are explicitly unverified group assumptions. Insurance is €0 **recognised**, with actual expense/prepayment **UNKNOWN** because reliable evidence is absent. The €2,000 disposal quote creates no provision without an established obligation. The villa photograph's 2024 dates remain visible alongside the 2026 bank transaction.

See [evidence classification](docs/EVIDENCE-INVENTORY.md) and [internal schema](docs/INTERNAL-SCHEMA.md). The original evidence is unchanged. Extracted workbooks include every populated cell, formula, cached result, comment and sheet visibility; source hashes are in `evidence-extracted/manifest.json`.

The original `agent-1-analysis.txt` and `agent-2-analysis.txt` are retained with identical public copies under `public/analyses`. `node scripts/import-agent-analyses.mjs` extracts each material row, preserving the exact source row, source line, original confidence, challenges and effect wording in `data/analyses.json`. It records the subsequent comparison time; original completion times and conversation IDs remain empty because they were not supplied. Independence is confirmed by the student and stated in both files, not inferred from invented conversation metadata. Importing analyses never certifies student positions.

The analyses agree on primary accounting amounts. There are five confidence differences and a presentation difference for D058/D072: Agent 1 puts stock damage below gross profit (€475,000), whereas Agent 2 includes it in cost of sales (gross profit €453,000). The site follows Agent 2’s presentation; both arrive at €77,000 operating profit and €65,000 net profit. Both cite an asset workbook still absent from this project, so those citations remain explicitly qualified.

## One canonical model

`data/inputs.ts` and `data/bank.json` hold evidenced inputs; `data/adopted-basis.ts` separates instructed assumptions from source facts. `lib/accounting.ts` calculates the statements, schedules and unique adjustment registry. `data/decisions.ts` combines the exact sanitized group structure with the current model, original-source citations and shared adjustment IDs. `lib/submission.ts` builds the single object consumed by `/`, `/review` and `/submission.json`.

Update evidence-backed inputs, rebuild, and run the checks to publish a consistent new snapshot. Never total the financial effects of the decision register: multiple decisions can describe one economic event or different comparison baselines. Source extraction scripts are optional development utilities; Python is not needed to run, build or deploy the website.
