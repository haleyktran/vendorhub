// ─── Commercial brief data ────────────────────────────────────────────────────
// Source: Signal Vendor Commercial Brief (Notion, updated 2026-03-27)
// Keyed by vendorContact.id

export type CommitmentTier = "none" | "low" | "medium" | "high"
// none   = ✅ No commit / PAYG
// low    = 🟡 <$10K upfront
// medium = ⚠️  $10K–$50K upfront
// high   = ❌  $50K+ upfront (requires scrutiny)

export type Capability =
  | "finds-enrich"         // company finder + enrichment API
  | "enrich-only"          // bring your domain, get fields back
  | "dataset"              // bulk flat-file purchase only
  | "finds-enrich-dataset" // all three
  | "platform"             // not a traditional data vendor

export type BudgetStatus = "excluded" | "exploring" | "tentative" | "signed"
// excluded  = PAYG / not budgeting for this vendor
// exploring = evaluating — include as possible upside
// tentative = likely to sign — include in base budget
// signed    = contract executed

export interface VendorCommercial {
  commitmentTier: CommitmentTier | null
  commitmentLabel: string            // human-readable amount, e.g. "$150K/yr"
  pricingTldr: string                // 1–2 sentence summary
  pricingDetail?: string             // longer notes for expanded panel
  capability: Capability | null
  capabilityLabel?: string           // override display label if needed
  commercialNextStep: string
  commercialOwner: "haley" | "will" | null
  questionnaireUrl?: string          // link to Google Doc vendor questionnaire
  annualBudgetUsd: number | null     // tentative annual spend in USD
  budgetStatus: BudgetStatus         // how firm this number is
}

export const vendorCommercialData: Record<string, VendorCommercial> = {

  // ── 🟢 READY ─────────────────────────────────────────────────────────────

  harmonic: {
    commitmentTier: "medium",
    commitmentLabel: "$10K min",
    pricingTldr: "$0.04/credit, $10K upfront min. API enrichment only — no bulk, no caching.",
    pricingDetail: "$10K credit commitment required upfront, then quarterly true-up at $0.04/credit. No data caching allowed — each end-customer call must be a unique live API call. No bulk dataset available for partners.",
    capability: "finds-enrich",
    commercialNextStep: "Reach out to Mike Palmer — confirm no-caching constraint before pricing convo. Request data partner agreement in parallel.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1vjT5BINvN0k0yCoXp_NtVvPpUXgFXzcV/edit",
    annualBudgetUsd: 10000,
    budgetStatus: "tentative",
  },

  upriver: {
    commitmentTier: "none",
    commitmentLabel: "No commit",
    pricingTldr: "Starting $500/mo + $0.08/credit. No advance required. Pilot period available.",
    pricingDetail: "Monthly minimum $500/mo; annual contracts $800–$2K/mo. Per-credit pricing sheet available. Pilot period available for evaluation before annual commitment.",
    capability: "finds-enrich",
    commercialNextStep: "Reach out to Lulu Zhang — demo done 3/24, API key shared. Clear path to commercial conversation.",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  adyntel: {
    commitmentTier: "none",
    commitmentLabel: "No commit",
    pricingTldr: "500K credits = $2,604 (sub) / $3,255 (PAYG). Only charged on successful returns.",
    pricingDetail: "1 credit = 1 successful API call. 500K: $2,604 sub / $3,255 PAYG. 1M: $4,687 / $5,859. 5M: $19K / $23K. Above 5M: custom pricing, credits don't expire. ~20% cheaper on subscription vs PAYG.",
    capability: "enrich-only",
    commercialNextStep: "Reach out to Andrei — favorable pay-per-success model. Straightforward commercial conversation.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1gEKLwZfPwDLH5DdSwwD3B3fYvju98y_f/edit",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  storeleads: {
    commitmentTier: "medium",
    commitmentLabel: "$25K advance",
    pricingTldr: "$25K advance = 500K domain credits @ $0.05/credit. Usage-based after. Standard redistribution deal (same as Clay, Artisan, Genesee).",
    pricingDetail: "$25K upfront = 500K domain credits @ $0.05/credit. Usage-based pricing beyond that. Standard redistribution partner deal — same structure as Clay, Artisan, Genesee. No flexibility claimed on structure. BYOK option for customers who already have Store Leads. 1-month dev access agreement pending from Ammar before full contract.",
    capability: "finds-enrich",
    commercialNextStep: "Receive and sign 1-month dev access agreement from Ammar. Then loop in eng team for integration.",
    commercialOwner: "haley",
    questionnaireUrl: "https://docs.google.com/document/d/1A2C1Ox2znxGLQrwBl5Jw_PK5crh4BPjS/edit",
    annualBudgetUsd: 25000,
    budgetStatus: "tentative",
  },

  theirstack: {
    commitmentTier: "none",
    commitmentLabel: "Zero upfront",
    pricingTldr: "Zero upfront. 1 credit = 1 job signal; 3 credits = 1 tech lookup. Volume discounts above 1M credits.",
    pricingDetail: "Pure PAYG — only charged when notifications fire. 1 credit = 1 job signal; 3 credits = 1 company technographic lookup. Volume discounts above 1M credits. Public pricing up to 1M; custom beyond. Best commercial model of any vendor in the eval.",
    capability: "finds-enrich",
    commercialNextStep: "Reach out to Xoel López — strongest commercial profile: zero upfront, pure PAYG. Get trial API invite + loop in finance for pricing above 1M credits.",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  serpstat: {
    commitmentTier: "none",
    commitmentLabel: "No commit",
    pricingTldr: "$9–10K one-time for full 1.8M domain DB dump. PAYG API also available per-credit.",
    pricingDetail: "$10K one-time for full 1.8M domain dataset (all SEO/traffic fields). PAYG per-credit API also available; partner pricing doc shared post-call. Rate limits: 1 req/sec standard, 10 req/sec top tier.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Reach out to Eugene Romanuk — $9–10K one-time dataset is a standout low-commitment option. Loop Will into email thread (Eugene flagged this specifically).",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  openmart: {
    commitmentTier: "high",
    commitmentLabel: "$80K min",
    pricingTldr: "$80K min, $0.006/credit. Lower min = higher per-credit rate. Flexible on negotiation.",
    pricingDetail: "$80K bulk minimum. $0.006/credit at that tier. Credit costs: 1 credit = company lookup, 2 credits = email, 8 credits = phone. Lower commitment likely possible at higher per-credit rate.",
    capability: "finds-enrich",
    commercialNextStep: "Negotiate $80K min down with Kathryn — expect higher per-credit rate at lower commitment.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1hExzGNYBfFPnN-qB151piiGsXEIUNiTR/edit",
    annualBudgetUsd: 80000,
    budgetStatus: "exploring",
  },

  // ── 🟡 WAIT ──────────────────────────────────────────────────────────────

  charmio: {
    commitmentTier: "none",
    commitmentLabel: "PAYG proposed",
    pricingTldr: "PAYG / no-commit option proposed (Option A, preferred). Final terms TBD pending Alex's response.",
    pricingDetail: "Three options proposed: Option A (PAYG/no upfront) is our preferred path. Also offered minimum commit + rev share alternatives. Awaiting Alex Nisenzon's response.",
    capability: "finds-enrich",
    commercialNextStep: "Follow up with Alex once reply received. Option A (PAYG/no upfront) is the preferred path.",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  similarweb: {
    commitmentTier: "high",
    commitmentLabel: "$50K+ / 10K credits",
    pricingTldr: "10K credits = $50K/yr ($0.417/credit). 100K credits = $130K/yr ($0.108/credit). Needs negotiation.",
    pricingDetail: "Credit-based model. Credits = # of URLs × # of metrics × time granularity. 10K credits → $50K/yr ($0.417/cr). 100K credits → $130K/yr ($0.108/cr). Need to pick specific endpoints before quoting. Trial access active.",
    capability: "finds-enrich",
    commercialNextStep: "Haley: send URL volume estimate + endpoint list to Miriam to unblock pricing quote. Will already on thread.",
    commercialOwner: "haley",
    annualBudgetUsd: 50000,
    budgetStatus: "exploring",
  },

  seranking: {
    commitmentTier: "none",
    commitmentLabel: "No commit",
    pricingTldr: "PAYG credit model. No upfront. Pricing call 3/31 with Alex Trusevich — open to custom partner terms.",
    pricingDetail: "Pure PAYG. AI search/LLM visibility data is more expensive than standard SEO data (key differentiator). Custom annual partnership pricing available. Pricing calculator: help.seranking.com/hc/en-us/articles/21487397355420. Come to 3/31 call with volume estimates and field priorities.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Will: join 3/31 pricing call with Alex Trusevich — come with volume estimates and field priorities. No upfront commitment required.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1cQ_IxMQSe7fRc3kHjAqr9tZSLCFbkwSh/edit",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  cbinsights: {
    commitmentTier: "high",
    commitmentLabel: "6-fig license",
    pricingTldr: "6-figure license + $0.01/Mosaic score call. Formal proposal due next week.",
    pricingDetail: "Annual license fee + per-call usage. $0.01/Mosaic score call. Separate pricing for per-call usage vs. dataset purchase. Proposal coming next week from Rawley Dawson.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Wait — formal proposal due next week from Rawley Dawson.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1PuchAdmzhZ35EJY8sslcbeavHymK0Z_2/edit",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

  dealroom: {
    commitmentTier: "medium",
    commitmentLabel: "€12K/yr",
    pricingTldr: "€12K/yr entry → €45K/yr unlimited. Best price point in the fundraising category. 2-week trial API available.",
    pricingDetail: "Annual license, tiered by API call volume. €12K/yr entry (limited calls) → €45K/yr unlimited OEM. Apollo uses the unlimited OEM model. €12K entry is the right starting point — gives access to evaluate before scaling. Questionnaire being filled by Kjeld + Miguel as of 3/27.",
    capability: "finds-enrich",
    commercialNextStep: "Will: review questionnaire responses from Kjeld/Miguel, then move to commercial conversation. €12K entry is the best starting point vs. Crunchbase ($150K) or PitchBook (~$160K).",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1XfJYV4yaO-IBs2LQwKcXcjUoxfQ2TV-L3EwgkvNXXjo/edit",
    annualBudgetUsd: 13000,
    budgetStatus: "tentative",
  },

  theswarm: {
    commitmentTier: "none",
    commitmentLabel: "No upfront",
    pricingTldr: "Partner tier: $500/mo = 50K credits. Flat file: $10K/mo (600M profiles, AWS S3). No upfront.",
    pricingDetail: "Self-serve: $99/mo (Base), $299/mo (Premium). Partner tier: $500/mo = 50K credits (~5x cheaper at higher volumes). Flat file: $10K/mo (AWS S3; 600M profiles, 100M companies, 200M emails). Enterprise/reseller: custom — to be defined on 3/30 call. Clay uses BYOA model.",
    capability: "enrich-only",
    commercialNextStep: "Will: join 3/30 call with Grace + David — lock in enterprise/reseller partner structure.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/10pDlnPwR2NHC_QKzHUoRbVTwdofAXD-XS4O2z75CJcA/edit",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  adbeat: {
    commitmentTier: null,
    commitmentLabel: "TBD",
    pricingTldr: "TBD — Clay-style annual credit model likely. VP Ops (Mark) approval needed before terms can be offered.",
    pricingDetail: "Porter is consulting with VP Operations on partnership structure. Annual credit allocation model (similar to Clay deal) expected. Adyntel (competitor) is at $0.06/credit (50K vol), $0.05/credit (100K+) — use as anchor. Demo done 3/26.",
    capability: "enrich-only",
    commercialNextStep: "Will: wait for VP Ops approval. Reference Adyntel pricing as anchor when terms come.",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

  beauhurst: {
    commitmentTier: "medium",
    commitmentLabel: "£20–40K/yr",
    pricingTldr: "£20–40K/yr seat-based + API. Awaiting CEO approval on their side.",
    pricingDetail: "Annual seat-based license + API integration. UK and German private company data (5M+ UK private companies from Companies House filings). Strong niche for EU coverage.",
    capability: "finds-enrich",
    commercialNextStep: "Wait — CEO approval pending on their side.",
    commercialOwner: null,
    annualBudgetUsd: 38000,
    budgetStatus: "exploring",
  },

  // ── 🔴 BLOCKED / DEPRIORITIZED ───────────────────────────────────────────

  crunchbase: {
    commitmentTier: "high",
    commitmentLabel: "$150K/yr advance",
    pricingTldr: "$150K non-refundable annual advance. Per-enrichment $0.05–$0.15/call by data type. 12-mo auto-renew.",
    pricingDetail: "Annual advance of $150K, non-refundable, invoiced at contract start. Applied as credit against enrichment fees. Per-enrichment schedule: funding/investors/financials $0.15; basic company $0.05; categories $0.07; person profile $0.07. Contract: 12 months, auto-renewing, 30-day cancellation notice. Access: API + initial data dump. Validate that $150K aligns with expected enrichment volume at blended ~$0.10–0.15/call.",
    capability: "finds-enrich",
    commercialNextStep: "Will: review $150K advance terms vs. expected volume. Decide if worth signing — consider Dealroom (€12K) as lower-cost alternative for overlapping signals.",
    commercialOwner: "will",
    annualBudgetUsd: 150000,
    budgetStatus: "excluded",
  },

  pitchbook: {
    commitmentTier: "high",
    commitmentLabel: "~$160K/yr",
    pricingTldr: "~$160K/yr min (1K users × $160/user). Deprioritized vs. Dealroom (€12–45K/yr).",
    pricingDetail: "Seat-based annual license ~$160K/yr (1K users × $160/user). Per-call API pricing TBD — Charlie Weiss sharing data eval contacts. Key question: does PitchBook's depth justify 3–13× price premium over Dealroom for overlapping signals? MCP server available for existing licensees.",
    capability: "finds-enrich",
    commercialNextStep: "Hold — wait for Charlie Weiss to share data eval contacts. High price requires careful evaluation vs. Dealroom before progressing.",
    commercialOwner: "will",
    annualBudgetUsd: 160000,
    budgetStatus: "excluded",
  },

  spade: {
    commitmentTier: "high",
    commitmentLabel: "6-fig OEM floor",
    pricingTldr: "6-figure OEM annual target. NDA signed 3/26. Usage estimate sent — awaiting quote from Oban.",
    pricingDetail: "Volume-based per API call / merchant enrichment. OEM/reseller model. 6-figure annual target is almost certainly too high for current volume and will need significant negotiation. NDA signed by Will 3/26. Usage estimate (~5K/mo → 20K+) sent 3/26 to unblock pricing.",
    capability: "enrich-only",
    commercialNextStep: "Will: await quote from Oban. Lily traveling through Fintech Meetup. 6-fig floor needs significant negotiation down.",
    commercialOwner: "will",
    questionnaireUrl: "https://docs.google.com/document/d/1C70UsMqyC-EiufRX2EgGEMgMDFUHN4sL/edit",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

  "reodev": {
    commitmentTier: null,
    commitmentLabel: "Not discussed",
    pricingTldr: "No pricing discussed. Needs formal partnership proposal from us before re-engaging.",
    pricingDetail: "Call focused on integration model only. Individual API keys per customer model discussed. Company finder in development. Need formal partnership proposal outlining use case before any commercial terms can be set.",
    capability: "enrich-only",
    commercialNextStep: "Will: send formal partnership proposal before re-engaging — include high-level pricing structure and Unify's differentiation vs. Clay.",
    commercialOwner: "will",
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  explorium: {
    commitmentTier: "high",
    commitmentLabel: "$60K/yr min",
    pricingTldr: "$60K/yr = 6M credits ($0.0125/cr). 1cr/company, 2cr/tech, 5cr/contact. Preview before charge — only billed on used results. Only provider with intent-based list building (Bombora).",
    pricingDetail: "$60K/yr minimum = 6M credits at $0.0125/credit. Credit breakdown: 1cr/company enrichment, 2cr/technographics, 2-3cr/events, 5cr/contact enrichment. Standard 200 QPM; partners get 1,000 QPM. Preview functionality included — results shown before credits are charged. Can combine bulk data + API credits. Bulk flat file needed for on-demand filtering. Data page: companyenrich.com/our-data.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Awaiting pricing options (API-only vs bulk+API) from Roy/Omer. Haley to intro data engineer for bulk data evaluation. Target: commercial agreements signed within a few weeks.",
    commercialOwner: "haley",
    questionnaireUrl: "https://docs.google.com/document/d/1JeGvBYx-TqQKzDwjbfmLsqVczsi1lkq7/edit",
    annualBudgetUsd: 60000,
    budgetStatus: "tentative",
  },

  crustdata: {
    commitmentTier: "medium",
    commitmentLabel: "$4K/mo min",
    pricingTldr: "$4K/mo = 40K credits. Full dataset $20K/mo. Deprioritized — better for on-prem evaluation.",
    pricingDetail: "API: $4K/mo = 40K credits. Real-time: $0.10/credit (1 company/credit). Cached: $0.001/company (100 companies/credit). Full people dataset: $20K/mo ($240K/yr). Better suited for on-prem dataset evaluation vs. API enrichment vendor.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Deprioritized — better suited for on-prem dataset evaluation. No immediate action.",
    commercialOwner: null,
    annualBudgetUsd: 48000,
    budgetStatus: "exploring",
  },

  retentiondotcom: {
    commitmentTier: "none",
    commitmentLabel: "No prepaid",
    pricingTldr: "$0.05–$0.08/resolution + $1.00/domain fee. Usage-based, no prepaid. Deprioritized.",
    pricingDetail: "OEM: $0.08/resolution + $1.00/domain. Volume tiers: $0.06 at 50K, $0.05 at 100K+. Usage-based, no prepaid credits. Website visitor de-anonymization only. Skip for now.",
    capability: "enrich-only",
    commercialNextStep: "Skip for now — deprioritized.",
    commercialOwner: null,
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  // ── TBD / UPCOMING ────────────────────────────────────────────────────────

  hithorizons: {
    commitmentTier: "low",
    commitmentLabel: "€3.5K/60K calls",
    pricingTldr: "API: €3.5K/60K calls → €33K/6M calls. Bulk EU dataset: €220K/yr.",
    pricingDetail: "API pricing: €3,500/60K calls → €33,000/6M calls. Bulk EU dataset: €220K/yr. European company coverage specialist: 80M+ companies. 10-day trial available — activate by replying to Tibor.",
    capability: "finds-enrich",
    commercialNextStep: "Reply to Tibor Jánoška to activate 10-day API trial, then evaluate pricing tiers.",
    commercialOwner: "haley",
    questionnaireUrl: "https://docs.google.com/document/d/1_lY9njd9jy5wGnX0vAR-VDc8BGmyTHri/edit",
    annualBudgetUsd: 4000,
    budgetStatus: "exploring",
  },

  buyercaddy: {
    commitmentTier: "high",
    commitmentLabel: "$50K min",
    pricingTldr: "$50K min partnership = few million credits. 1cr/firmographic, 2cr/technographic, 5cr/contact. 50% off website rates. 180K products tracked. 6-figure annual target.",
    pricingDetail: "Partnership deal minimum: $50K (few million credits). Target annual: 6-figures. Credit tiers: 1cr firmographic, 2cr technographic, 5cr contact/social. 50% discount from public website rates. Can combine bulk data (S3/Snowflake monthly distribution) + API credits + contact enrichment. 180K IT products, 92K vendors, 31.2M+ companies across 55 countries. MCP server available. AI-native stack, lean 10-engineer team — claims most competitive partnership pricing in market.",
    capability: "finds-enrich-dataset",
    commercialNextStep: "Engage Craig/Mitch via #buyercaddy-unify Slack — get trial API access and evaluate vs HG Insights for technographic coverage. Lock in partnership structure.",
    commercialOwner: "haley",
    annualBudgetUsd: 50000,
    budgetStatus: "tentative",
  },

  builtwith: {
    commitmentTier: "none",
    commitmentLabel: "PAYG",
    pricingTldr: "PAYG Domain API credits. Volume discounts at >1M credits. No special partnership required.",
    pricingDetail: "Gary Brewer confirmed Clay just uses the standard public Domain API — no OEM/partnership deal required. Volume discounts kick in at >1M API credits.",
    capability: "enrich-only",
    commercialNextStep: "Evaluate Domain API pricing tiers for our expected volume vs. BuyerCaddy.",
    commercialOwner: null,
    annualBudgetUsd: null,
    budgetStatus: "excluded",
  },

  dealfront: {
    commitmentTier: null,
    commitmentLabel: "TBD",
    pricingTldr: "Intro call Fri 3/27 9am PDT — all details TBD.",
    capability: null,
    commercialNextStep: "Attend intro call Fri 3/27 9am PDT with Matthew Fairey.",
    commercialOwner: "haley",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

  hginsights: {
    commitmentTier: null,
    commitmentLabel: "TBD",
    pricingTldr: "Intro call Mar 24 — details TBD from call notes.",
    capability: "enrich-only",
    commercialNextStep: "Fill in pricing + structure from call notes. Send follow-up to Ed Field.",
    commercialOwner: "haley",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

  semrush: {
    commitmentTier: "high",
    commitmentLabel: "6-fig/yr min",
    pricingTldr: "6-fig annual minimum. Volume-based pricing grid across traffic, backlinks, and AI visibility APIs. Bundling multiple APIs gets better rates. Adobe acquisition adds exec approval overhead.",
    pricingDetail: "Six-figure annual minimum — similar structure to Clay partnership model. Cost drivers: API access fees + usage volume. Economies of scale when bundling multiple APIs. Recommended phase 1: (1) traffic & engagement data (domain-level), (2) backlinks DB (2nd largest after Google, Authority Score 0–100), (3) AI/LLM visibility (share of voice, brand mentions in LLMs). Approval process: Haley discusses 6-fig min with finance → demo to Semrush → exec summary required by Semrush leadership (Adobe acquisition) → final proposal with pricing breakdown.",
    capability: "enrich-only",
    commercialNextStep: "Haley: discuss 6-fig annual minimum with finance team. Then: schedule demo/workflow presentation to Semrush team → submit exec summary (required for Adobe acquisition) → receive final partnership proposal.",
    commercialOwner: "haley",
    annualBudgetUsd: null,
    budgetStatus: "exploring",
  },

}
