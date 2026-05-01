import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────────────────

type EvalStatus = "evaluated" | "failed" | "pending"
type InputMethod = "linkedin-url" | "linkedin-slug" | "name-domain"

interface VendorEvalResult {
  id: string
  name: string
  status: EvalStatus
  inputMethod: InputMethod | null
  worksEmail: boolean
  personalEmail: boolean
  phone: boolean
  matchRate: number | null
  emailCoverage: number | null         // /1000 — any email (work + personal, deduped)
  workEmailCoverage: number | null     // /1000 — corporate/work email only
  personalEmailCoverage: number | null // /1000 — webmail/personal email only
  phoneCoverage: number | null         // /134-contact subset
  phoneCoverageFull: number | null     // /1000 — full dataset phone run (select vendors)
  wfRescueEmail: number | null
  combinedEmail: number | null
  recall: number | null
  precisionLabel: string | null
  zbWorkValidPct?: number | null   // ZeroBounce valid % on work emails (cross-check)
  latencyLabel: string | null
  notionUrl: string | null
  commentary: string
  waterfallNote?: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Dataset: 1,000 contacts, primary ID = LinkedIn slug (982/1,000 have one)
// Waterfall baseline: 472 emails + 71 phones (134-contact phone subset)
// Name+domain vendors: only 142/1,000 contacts eligible — capped at 14.2%

const linkedInVendors: VendorEvalResult[] = [
  {
    id: "forager",
    name: "Forager",
    status: "evaluated",
    inputMethod: "linkedin-slug",
    worksEmail: false,
    personalEmail: true,
    phone: true,
    matchRate: 87.3,
    emailCoverage: 474,
    workEmailCoverage: 20,
    personalEmailCoverage: 470,
    phoneCoverage: 40,
    phoneCoverageFull: 279,
    wfRescueEmail: 200,
    combinedEmail: 673,
    recall: 93.5,
    precisionLabel: "100% VALID",
    latencyLabel: "~1,022ms avg total (sync) — 4 serial calls per contact: detail + personal email + work email + phone (~255ms per call avg)",
    notionUrl: "https://app.notion.com/p/34fd5e4e099a8189a9a1c52feaf73b57",
    commentary: "Highest match rate (87.3%) and 100% VALID precision — but 470/474 emails are personal (webmail), only 20 are work. Not a work email source despite the headline coverage. Best use case: personal email enrichment and identity resolution. 93.5% recall vs WF-confirmed contacts.",
    waterfallNote: "P1 for personal email. Not a work email source — pair with Wiza for work email coverage.",
  },
  {
    id: "contactout",
    name: "ContactOut",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: true,
    phone: true,
    matchRate: 73.4,
    emailCoverage: 721,
    workEmailCoverage: 373,
    personalEmailCoverage: 625,
    phoneCoverage: 101,
    phoneCoverageFull: 644,
    wfRescueEmail: 311,
    combinedEmail: 786,
    recall: 88.0,
    precisionLabel: "No native signal (V2 batch)",
    zbWorkValidPct: 65.5,
    latencyLabel: "Phone (sync): ~195ms avg · Work email: ~7min async batch (1,000/batch) · Personal email: sync per-contact",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81dcb828c9c18251b5a2",
    commentary: "Best phone (101/134, 75.4%) and highest recall (88.0%). 721 total emails = 373 work + 625 personal (some contacts have both). Dominant personal email source. Two API keys required (work vs. personal billed separately). Work email batch is slow (~7 min for 1,000).",
    waterfallNote: "Best-in-class for phone and personal email. Work email trails Wiza — use for phone-first or personal email enrichment.",
  },
  {
    id: "prospeo",
    name: "Prospeo",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: false,
    phone: true,
    matchRate: 72.8,
    emailCoverage: 283,
    workEmailCoverage: 283,
    personalEmailCoverage: 0,
    phoneCoverage: 84,
    phoneCoverageFull: 502,
    wfRescueEmail: 57,
    combinedEmail: 529,
    recall: 80.0,
    precisionLabel: "100% VERIFIED (native)",
    zbWorkValidPct: 78.4,
    latencyLabel: "~449ms avg (sync, bulk 50/batch) — email + phone returned in one combined call; p50: 471ms, p95: 955ms",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81399eb6dca318edca2d",
    commentary: "Best-in-class email precision: 100% VERIFIED on all 283 returned emails (zero CATCHALL or RISKY). ZeroBounce cross-check: 78.4% valid, 13.8% catch-all, 5.7% invalid — VERIFIED is a lighter check than full SMTP. Strong phone (84/134, 62.7%). Uses bulk endpoint (50/batch, synchronous).",
    waterfallNote: "Best precision of any vendor. Strong phone. Use as a high-confidence email layer — not for maximum coverage.",
  },
  {
    id: "limadata",
    name: "Limadata",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: false,
    phone: true,
    matchRate: 49.1,
    emailCoverage: 480,
    workEmailCoverage: 480,
    personalEmailCoverage: 0,
    phoneCoverage: 38,
    phoneCoverageFull: null,
    wfRescueEmail: 121,
    combinedEmail: 596,
    recall: 76.2,
    precisionLabel: "No signal (email or 404)",
    latencyLabel: "Email endpoint: avg 2,323ms (p50: 171ms, p95: 11,254ms — heavy tail) · Phone endpoint: avg 196ms (p50: 134ms, p95: 261ms) — separate endpoints, measured independently",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81d88e99f345e2a1d1a3",
    commentary: "Highest work email coverage (480/1,000, 48%) with 76.2% recall. Rescued 121 contacts Waterfall missed. No email validity signal — you get an email or nothing. Tail latency issue (~5% of requests hit 10–22s) flagged with vendor.",
    waterfallNote: "P1 for work email volume. Pair with Forager for personal email or ContactOut for phone.",
  },
  {
    id: "aviato",
    name: "Aviato",
    status: "evaluated",
    inputMethod: "linkedin-slug",
    worksEmail: true,
    personalEmail: true,
    phone: false,
    matchRate: 52.7,
    emailCoverage: 527,
    workEmailCoverage: 184,
    personalEmailCoverage: 326,
    phoneCoverage: 0,
    phoneCoverageFull: null,
    wfRescueEmail: 223,
    combinedEmail: 698,
    recall: 64.0,
    precisionLabel: "No signal (work + personal mixed)",
    latencyLabel: "Async batch (100/call) — submit time not tracked; results returned when batch completes (email only, no phone)",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81f7ab17d488d42fd52f",
    commentary: "527 emails returned (184 work, 326 personal, 17 student) — headline coverage is inflated vs. pure-work vendors. Best combined email coverage at 69.8% when added to Waterfall. No phone. Work/personal type field available for post-filtering.",
    waterfallNote: "Best if you want both email types in one call. No phone. Filter by type post-fetch.",
  },
  {
    id: "wiza",
    name: "Wiza",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: true,
    phone: true,
    matchRate: 95.0,
    emailCoverage: 690,
    workEmailCoverage: 549,
    personalEmailCoverage: 451,
    phoneCoverage: 94,
    phoneCoverageFull: null,
    wfRescueEmail: 127,
    combinedEmail: 743,
    recall: 97.4,
    precisionLabel: "91% VALID (12 risky, 47 unknown)",
    latencyLabel: "~205ms avg (async submit only) — actual enrichment resolves async; requires >=1800s poll timeout for large batches",
    notionUrl: "https://www.notion.so/unifygtm/34fd5e4e099a81f3b141f3c96cffcdc3",
    commentary: "Top-tier coverage: 95% person match, 69% email (549 work / 451 personal), 97.4% recall vs WF-confirmed contacts. 91% VALID precision. Phone strong at 70.1% (94/134 subset). Initial eval was understated due to polling timeout — all contacts resolved correctly on full re-poll.",
    waterfallNote: "Strong all-around vendor — top-2 email coverage, #1 recall, solid phone. Best used with a long async poll window (30min+) for large batches.",
  },
  {
    id: "bettercontact",
    name: "BetterContact",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: false,
    phone: true,
    matchRate: 87.0,
    emailCoverage: 42,
    workEmailCoverage: 42,
    personalEmailCoverage: 0,
    phoneCoverage: 99,
    phoneCoverageFull: 638,
    wfRescueEmail: 10,
    combinedEmail: 482,
    recall: 96.0,
    precisionLabel: "31% deliverable (of 14 w/ status; 28 unverified bonus emails)",
    latencyLabel: "~2–3min async batch resolution (100/batch) — phone + email returned together; no per-signal latency split",
    notionUrl: "https://app.notion.com/p/351d5e4e099a81fc941df6b548bf3dd7",
    commentary: "Surprise standout for phone: 638/1,000 (63.8%) full-dataset coverage — essentially tied with ContactOut (644). 87% person match rate and 96% recall vs WF-confirmed contacts. Email is weak (42/1,000, 4.2%) but phone is top-tier. UBE traffic is particularly strong (52% phone coverage). Phone results also surface contact names, driving the high match/recall numbers.",
    waterfallNote: "Top-tier phone vendor — essentially tied with ContactOut on full-dataset phone coverage (638 vs 644). Not for email. Stack after Waterfall for phone enrichment.",
  },
  {
    id: "rocketreach",
    name: "RocketReach",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: false,
    personalEmail: false,
    phone: true,
    matchRate: 86.2,
    emailCoverage: 0,
    workEmailCoverage: 0,
    personalEmailCoverage: 0,
    phoneCoverage: 81,
    phoneCoverageFull: 420,
    wfRescueEmail: 0,
    combinedEmail: 0,
    recall: 93.5,
    precisionLabel: "No validity signal (type: mobile/professional/unknown)",
    latencyLabel: "Phone only (sync): avg 681ms · p50: 647ms · p95: 1,156ms · p99: 2,684ms — single call with reveal_phone=true",
    notionUrl: "",
    commentary: "Phone-only eval (no email requested). 81/125 phone subset coverage (64.8%) — #4 overall behind ContactOut, BetterContact, and Prospeo. Full-dataset: 420/982 (42.8%) with any phone. Returns multiple phones per contact (avg 4–5) with type field (mobile/professional/unknown) and a recommended flag. No validity/deliverability signal. 15 connection errors on full run (http=0). Universal Credit API: GET /api/v2/universal/person/lookup?reveal_phone=true.",
    waterfallNote: "Strong phone coverage — ranks #4 on subset behind ContactOut, BetterContact, Prospeo. Returns many phone candidates per contact with type hints. No email capability tested. Worth stacking for phone enrichment after ContactOut/BetterContact.",
  },
  {
    id: "swordfish",
    name: "Swordfish",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: false,
    personalEmail: true,
    phone: true,
    matchRate: 33.7,
    emailCoverage: 328,
    workEmailCoverage: 0,
    personalEmailCoverage: 328,
    phoneCoverage: 55,
    phoneCoverageFull: null,
    wfRescueEmail: 109,
    combinedEmail: 581,
    recall: 46.9,
    precisionLabel: "No signal — ZeroBounce pass recommended",
    latencyLabel: "Personal email: avg 3,535ms · p50: 1,836ms · p95: 13,473ms · p99: 24,409ms ⚠️ · Phone: avg 2,070ms · p95: 3,070ms — two separate calls (must_have=1 email, must_have=3 mobile), each measured independently",
    notionUrl: "https://app.notion.com/p/353d5e4e099a8160afc5e2d87e51e324",
    commentary: "Personal email specialist — returns webmail/personal addresses only (no work email). 328/1,000 personal emails; 55/134 mobile phones (41.0%). Strong UBE performance: 55.9% personal email on UBE vs 30.2% on CSV/Async. Strong senior skew: VP/C-Suite 64–74% personal email hit rate vs 8–17% for junior roles. Severe email tail latency (p95 13s, p99 24s) but phone is well-behaved (p95 3s). No email validity signal — run ZeroBounce before sending.",
    waterfallNote: "Best for personal email enrichment, especially for senior/exec audiences and UBE traffic. Phone ranks #4 (41.0% subset). Not a work email source at all.",
  },
  {
    id: "crustdata",
    name: "Crustdata",
    status: "evaluated",
    inputMethod: "linkedin-url",
    worksEmail: true,
    personalEmail: true,
    phone: true,
    matchRate: 21.9,
    emailCoverage: 169,
    workEmailCoverage: 17,
    personalEmailCoverage: 152,
    phoneCoverage: 23,
    phoneCoverageFull: null,
    wfRescueEmail: 69,
    combinedEmail: 542,
    recall: 23.4,
    precisionLabel: "No signal",
    latencyLabel: "~4,853ms avg (sync) · p50: 3,489ms · p95: 15,794ms · p99: 23,964ms — email + phone in one call; latency is prohibitive for inline use",
    notionUrl: "https://app.notion.com/p/350d5e4e099a812da77cf7bd6385b625",
    commentary: "Low match rate (21.9%) and weak email coverage (169/1,000). ~90% of email hits are personal (gmail/yahoo) — work email is only ~17/1,000. Latency is prohibitive — avg ~4.8s, p95 15.8s, p99 24s. Phone (23/134) is lowest of any vendor tested.",
    waterfallNote: "Not recommended for inline use — latency is prohibitive. Only viable for async/batch enrichment at low priority.",
  },
]

const nameDomainVendors: VendorEvalResult[] = [
  {
    id: "enrow",
    name: "Enrow",
    status: "evaluated",
    inputMethod: "name-domain",
    worksEmail: true,
    personalEmail: false,
    phone: true,
    matchRate: 8.8,
    emailCoverage: 86,
    workEmailCoverage: 86,
    personalEmailCoverage: 0,
    phoneCoverage: 3,
    phoneCoverageFull: null,
    wfRescueEmail: 26,
    combinedEmail: 498,
    recall: 12.8,
    precisionLabel: "100% VALID",
    latencyLabel: "Async batch (email only) — submit + poll; no per-endpoint timing tracked",
    notionUrl: "https://app.notion.com/p/34fd5e4e099a81f2aa8de4b0a2f11d25",
    commentary: "Only 142/1,000 contacts eligible (requires name+domain). Within those, quality is high — 100% VALID emails. Phone at $50/lookup is cost-prohibitive at scale.",
    waterfallNote: "High quality but wrong input type for our dataset. Skip unless we shift to name+domain-first.",
  },
  {
    id: "icypeas",
    name: "IcyPeas",
    status: "evaluated",
    inputMethod: "name-domain",
    worksEmail: true,
    personalEmail: false,
    phone: false,
    matchRate: 14.2,
    emailCoverage: 56,
    workEmailCoverage: 56,
    personalEmailCoverage: 0,
    phoneCoverage: 0,
    phoneCoverageFull: null,
    wfRescueEmail: 11,
    combinedEmail: 483,
    recall: 18.7,
    precisionLabel: "ultra_sure / probable tiers",
    latencyLabel: "Async (email only) — submit + poll; no per-endpoint timing tracked",
    notionUrl: "https://app.notion.com/p/34fd5e4e099a81a2aefed5b0a0587ebe",
    commentary: "Email-only vendor capped at the same 142-contact ceiling. Proprietary confidence tiers instead of SMTP verification. Lowest email coverage in the eval.",
    waterfallNote: "Email only, no phone. Limited value for LinkedIn-slug-first workflows.",
  },
  {
    id: "snov",
    name: "Snov.io",
    status: "evaluated",
    inputMethod: "name-domain",
    worksEmail: true,
    personalEmail: false,
    phone: false,
    matchRate: 11.2,
    emailCoverage: 62,
    workEmailCoverage: 62,
    personalEmailCoverage: 0,
    phoneCoverage: 0,
    phoneCoverageFull: null,
    wfRescueEmail: 18,
    combinedEmail: 490,
    recall: 14.5,
    precisionLabel: "50% verified (rest unknown)",
    latencyLabel: "Async batch (email only) — submit + poll; no per-endpoint timing tracked",
    notionUrl: "https://app.notion.com/p/34fd5e4e099a81acbdeffe735032383d",
    commentary: "Same name+domain cap. Only 50% of returned emails are verified — weakest precision in the eval. OAuth complexity adds integration overhead.",
    waterfallNote: "Weakest precision tested. Same input cap. Limited value for our dataset.",
  },
]

const pendingVendors: { name: string; type: string }[] = [
  { name: "Surfe", type: "phone" },
  { name: "Upcell", type: "phone" },
  { name: "Dropcontact", type: "email" },
  { name: "Kitt AI", type: "email" },
  { name: "LeadMagic", type: "both" },
  { name: "Bytemine", type: "both" },
  { name: "Zeliq", type: "phone" },
  { name: "Swordfish", type: "phone" },
  { name: "SignalHire", type: "both" },
  { name: "Signaliz", type: "both" },
  { name: "LeadIQ", type: "both" },
  { name: "Lusha", type: "both" },
  { name: "ContactLevel", type: "both" },
  { name: "Datagma", type: "both" },
  { name: "EnrichCRM", type: "both" },
  { name: "Findymail", type: "both" },
  { name: "Pubrio", type: "phone" },
  { name: "Hunter", type: "email" },
  { name: "SMARTe", type: "both" },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const WF_EMAIL = 472
const WF_PHONE = 71
const PHONE_SUBSET = 134
const ALL_VENDORS = [...linkedInVendors, ...nameDomainVendors]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function coveragePct(n: number | null, total: number): string {
  if (n === null) return ""
  return `${Math.round((n / total) * 100)}%`
}

function rankBar(value: number, max: number, barColor: string, isWinner: boolean) {
  const w = Math.max(4, Math.round((value / max) * 100))
  return (
    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${barColor} ${isWinner ? "" : "opacity-40"}`}
        style={{ width: `${w}%` }}
      />
    </div>
  )
}


function typePills(v: VendorEvalResult) {
  return (
    <div className="flex flex-wrap gap-1">
      {v.worksEmail    && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">Work email</span>}
      {v.personalEmail && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">Personal email</span>}
      {v.phone         && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-medium">Phone</span>}
    </div>
  )
}

function statusDot(s: EvalStatus) {
  if (s === "evaluated") return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Evaluated" />
  if (s === "failed")    return <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Eval failed" />
  return <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" title="Pending" />
}

// ─── Rankings section ─────────────────────────────────────────────────────────

interface RankCategory {
  label: string
  subtitle: string
  barColor: string
  headerBg: string
  badgeCls: string
  outOf: number
  outOfLabel: string
  wfBaseline: number
  getValue: (v: VendorEvalResult) => number | null
}

const RANK_CATEGORIES: RankCategory[] = [
  {
    label: "Work Email",
    subtitle: "Corporate / professional address",
    barColor: "bg-blue-400",
    headerBg: "bg-blue-50/60 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-800",
    outOf: 1000,
    outOfLabel: "/ 1,000",
    wfBaseline: 472,
    getValue: v => v.workEmailCoverage,
  },
  {
    label: "Personal Email",
    subtitle: "Webmail — gmail, yahoo, etc.",
    barColor: "bg-purple-400",
    headerBg: "bg-purple-50/60 border-purple-200",
    badgeCls: "bg-purple-100 text-purple-800",
    outOf: 1000,
    outOfLabel: "/ 1,000",
    wfBaseline: 0,
    getValue: v => v.personalEmailCoverage,
  },
  {
    label: "Any Email",
    subtitle: "Work + personal combined",
    barColor: "bg-violet-400",
    headerBg: "bg-violet-50/60 border-violet-200",
    badgeCls: "bg-violet-100 text-violet-800",
    outOf: 1000,
    outOfLabel: "/ 1,000",
    wfBaseline: 472,
    getValue: v => v.emailCoverage,
  },
  {
    label: "Phone (subset)",
    subtitle: "134-contact apples-to-apples · all vendors",
    barColor: "bg-orange-400",
    headerBg: "bg-orange-50/60 border-orange-200",
    badgeCls: "bg-orange-100 text-orange-800",
    outOf: PHONE_SUBSET,
    outOfLabel: "/ 134",
    wfBaseline: 71,
    getValue: v => v.phoneCoverage,
  },
  {
    label: "Phone (all 1,000)",
    subtitle: "Full dataset run · ContactOut, BetterContact, Prospeo, Forager, Wiza",
    barColor: "bg-amber-500",
    headerBg: "bg-amber-50/60 border-amber-200",
    badgeCls: "bg-amber-100 text-amber-800",
    outOf: 1000,
    outOfLabel: "/ 1,000",
    wfBaseline: 0,
    getValue: v => v.phoneCoverageFull,
  },
]

function RankingsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {RANK_CATEGORIES.map(cat => {
        const ranked = ALL_VENDORS
          .map(v => ({ v, val: cat.getValue(v) ?? 0 }))
          .filter(x => x.val > 0)
          .sort((a, b) => b.val - a.val)
          .slice(0, 5)
        const max = Math.max(ranked[0]?.val ?? 1, cat.outOf * 0.75)
        const winner = ranked[0]?.v

        return (
          <div key={cat.label} className="rounded-lg border overflow-hidden">
            {/* Column header */}
            <div className={`px-4 py-3 border-b ${cat.headerBg}`}>
              <div className="text-xs text-muted-foreground">{cat.subtitle}</div>
              <div className="font-semibold text-sm mt-0.5">{cat.label}</div>
              {winner && (
                <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${cat.badgeCls}`}>
                    {winner.name}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {cat.getValue(winner)}{cat.outOfLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({coveragePct(cat.getValue(winner), cat.outOf)})
                  </span>
                </div>
              )}
            </div>

            {/* Ranked rows */}
            <div className="px-4 py-3 space-y-2.5">
              {ranked.map(({ v, val }, i) => (
                <div key={v.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">#{i + 1}</span>
                  <span className={`text-xs w-20 shrink-0 truncate ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {v.name}
                  </span>
                  {rankBar(val, max, cat.barColor, i === 0)}
                  <span className="text-xs tabular-nums text-muted-foreground w-6 text-right shrink-0">{val}</span>
                </div>
              ))}

              {/* WF baseline reference line */}
              {cat.wfBaseline > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t mt-1">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">—</span>
                  <span className="text-xs text-muted-foreground w-20 shrink-0">WF baseline</span>
                  <div className="flex-1 h-px bg-muted-foreground/30 relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-2 w-0.5 bg-muted-foreground/50"
                      style={{ left: `${Math.round((cat.wfBaseline / max) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-6 text-right shrink-0">{cat.wfBaseline}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Waterfall strategy panel ─────────────────────────────────────────────────

function WaterfallStrategy() {
  const rows = [
    {
      position: "P1 — Work email",
      vendor: "Wiza",
      why: "Highest work email coverage (549/1,000, 54.9%) with 97.4% recall and 91% VALID precision. Also returns personal email (451/1,000) and strong phone (94/134, 70.1%). Async — requires long poll window for large batches.",
      pill: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      position: "P2 — Personal email",
      vendor: "Forager",
      why: "470/1,000 personal emails (100% VALID), 87.3% match rate, 93.5% recall. Not a work email source — only 20/474 emails are corporate. Best for personal email enrichment and identity resolution.",
      pill: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      position: "P2 — Phone + personal email",
      vendor: "ContactOut",
      why: "Best phone (101/134, 75.4%) and best personal email source (625/1,000, 88% recall). Two keys required (work vs. personal billed separately). Work email batch is slow (~7 min).",
      pill: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      position: "P3 — High-precision work email",
      vendor: "Prospeo",
      why: "100% VERIFIED on all 283 returned emails — zero CATCHALL or RISKY. 72.8% match rate, 80% recall, strong phone (84/134). Use when precision matters more than volume.",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      position: "P4 — Work email fallback",
      vendor: "Limadata",
      why: "480/1,000 work emails (48%) with 76% recall. No validity signal but targeted endpoint returns email-or-nothing. Good fallback after Wiza for incremental work email coverage.",
      pill: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ]

  return (
    <div className="rounded-lg border divide-y">
      {rows.map(r => (
        <div key={r.position} className="flex gap-4 px-5 py-4">
          <div className="w-52 shrink-0">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{r.position}</div>
            <span className={`inline-block text-sm font-semibold px-2 py-0.5 rounded border ${r.pill}`}>{r.vendor}</span>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">{r.why}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Vendor card ──────────────────────────────────────────────────────────────

function VendorCard({ v }: { v: VendorEvalResult }) {
  const isFailed = v.status === "failed"

  function pct(n: number | null, total: number): string {
    if (n === null) return "—"
    return `${Math.round((n / total) * 100)}%`
  }

  function CoverageRow({
    label, value, outOf, color, note,
  }: {
    label: string; value: number | null; outOf: number; color: string; note?: string
  }) {
    if (value === null) return null
    const w = Math.round((value / outOf) * 100)
    return (
      <div>
        <div className="flex justify-between items-baseline mb-0.5">
          <span className={`text-xs font-medium ${color}`}>{label}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{value}</span>
            <span className="text-muted-foreground"> / {outOf.toLocaleString()}</span>
            <span className={`ml-1.5 font-semibold ${color}`}>({pct(value, outOf)})</span>
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color.replace("text-", "bg-").replace("-600", "-400").replace("-700", "-500")}`} style={{ width: `${w}%` }} />
        </div>
        {note && <div className="text-xs text-muted-foreground mt-0.5">{note}</div>}
      </div>
    )
  }

  const hasWorkEmail = (v.workEmailCoverage ?? 0) > 0
  const hasPersonalEmail = (v.personalEmailCoverage ?? 0) > 0
  const hasBothEmailTypes = hasWorkEmail && hasPersonalEmail

  return (
    <div className={`rounded-lg border bg-card shadow-sm overflow-hidden ${isFailed ? "opacity-75" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b bg-muted/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {statusDot(v.status)}
            <span className="font-semibold text-sm">
              {v.notionUrl
                ? <a href={v.notionUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-violet-600">{v.name}</a>
                : v.name}
            </span>
            {isFailed && <Badge variant="red">Eval failed</Badge>}
          </div>
          {typePills(v)}
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-xs text-muted-foreground">Match rate</div>
          <div className={`text-xl font-bold tabular-nums ${v.matchRate === null ? "text-muted-foreground" : v.matchRate >= 50 ? "text-emerald-700" : v.matchRate >= 30 ? "text-amber-700" : "text-red-600"}`}>
            {v.matchRate !== null ? `${v.matchRate.toFixed(0)}%` : "—"}
          </div>
        </div>
      </div>

      {/* Coverage */}
      <div className="px-5 py-4 space-y-4">

        {/* ── Email ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
            <span className="text-xs text-muted-foreground">WF baseline: {WF_EMAIL} / 1,000 (47%)</span>
          </div>
          <div className="space-y-2">
            {hasWorkEmail && (
              <CoverageRow label="Work" value={v.workEmailCoverage} outOf={1000} color="text-blue-600" />
            )}
            {hasPersonalEmail && (
              <CoverageRow label="Personal" value={v.personalEmailCoverage} outOf={1000} color="text-purple-600" />
            )}
            {!hasWorkEmail && !hasPersonalEmail && (v.emailCoverage ?? 0) > 0 && (
              <CoverageRow label="Email" value={v.emailCoverage} outOf={1000} color="text-violet-600" />
            )}
          </div>
          {hasBothEmailTypes && (
            <div className="text-xs text-muted-foreground mt-1.5">
              {v.emailCoverage} total unique · {v.workEmailCoverage! + v.personalEmailCoverage! - v.emailCoverage!} contacts have both
            </div>
          )}
          {v.wfRescueEmail !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>
                Rescued <span className="font-semibold text-foreground">{v.wfRescueEmail}</span> WF misses ·{" "}
                Combined with WF: <span className="font-semibold text-foreground">{v.combinedEmail} / 1,000</span>{" "}
                <span className="text-emerald-700 font-semibold">({pct(v.combinedEmail, 1000)})</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Phone ── */}
        <div className="border-t pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Phone</div>
          {v.phone ? (
            <div className="space-y-2">
              <CoverageRow
                label="134-contact subset"
                value={v.phoneCoverage}
                outOf={134}
                color="text-orange-600"
                note={`WF baseline: ${WF_PHONE} / 134 (53%)`}
              />
              {v.phoneCoverageFull !== null && v.phoneCoverageFull !== undefined && (
                <CoverageRow
                  label="All 1,000 contacts"
                  value={v.phoneCoverageFull}
                  outOf={1000}
                  color="text-amber-700"
                />
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Not offered</div>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Recall vs. WF</div>
            <div className={`text-sm font-semibold tabular-nums ${v.recall === null ? "text-muted-foreground" : v.recall >= 70 ? "text-emerald-700" : v.recall >= 40 ? "text-amber-700" : "text-red-600"}`}>
              {v.recall !== null ? `${v.recall.toFixed(1)}%` : "—"}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-0.5">Precision</div>
            <div className="text-xs font-medium text-foreground leading-tight">{v.precisionLabel ?? "—"}</div>
            {v.zbWorkValidPct != null && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">ZeroBounce valid (work):</span>
                <span className={`text-xs font-semibold tabular-nums ${v.zbWorkValidPct >= 80 ? "text-emerald-700" : v.zbWorkValidPct >= 70 ? "text-amber-700" : "text-red-600"}`}>
                  {v.zbWorkValidPct}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Latency + input ── */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Latency:</span> {v.latencyLabel ?? "—"}
          {" · "}
          <span className="font-medium text-foreground">Input:</span>{" "}
          {v.inputMethod === "linkedin-url" ? "LinkedIn URL" : v.inputMethod === "linkedin-slug" ? "LinkedIn slug" : "Name + domain"}
        </div>
      </div>

      {/* Commentary */}
      <div className="px-5 pb-4 border-t">
        <p className="text-xs text-muted-foreground leading-relaxed pt-3">{v.commentary}</p>
        {v.waterfallNote && (
          <p className="text-xs font-medium text-foreground mt-1.5">
            <span className="text-muted-foreground">Waterfall fit:</span> {v.waterfallNote}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EvalResultsHub() {
  const typeFilter: Record<string, string> = {
    both: "bg-slate-100 text-slate-700 border-slate-200",
    email: "bg-blue-50 text-blue-700 border-blue-200",
    phone: "bg-orange-50 text-orange-700 border-orange-200",
  }
  const typeLabel: Record<string, string> = { both: "Email + Phone", email: "Email", phone: "Phone" }

  return (
    <div className="space-y-10">

      {/* ── Context strip ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/20 px-5 py-4 text-sm">
        <div className="font-semibold text-foreground mb-2">About this eval</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="font-medium">Dataset:</span>{" "}
            <span className="text-muted-foreground">1,000 production contacts. Primary ID = LinkedIn slug (982/1,000 have one).</span>
          </div>
          <div>
            <span className="font-medium">Waterfall baseline:</span>{" "}
            <span className="text-muted-foreground">472 emails + 71 phones (from 134-contact phone subset) already found by Waterfall.</span>
          </div>
          <div>
            <span className="font-medium">Name+domain vendors</span>{" "}
            <span className="text-muted-foreground">only reach 142/1,000 contacts (14.2%). Their numbers reflect that ceiling, not quality.</span>
          </div>
        </div>
      </div>

      {/* ── Rankings ──────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">Rankings by category</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Top 5 vendors per signal type. Work and personal email ranked separately — a vendor returning both appears in both columns.
          WF baseline shown as reference. Phone column is 134-contact subset only.
        </p>
        <RankingsSection />
      </div>

      {/* ── Waterfall strategy ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">Where each vendor fits in the waterfall</h2>
        <p className="text-sm text-muted-foreground mb-3">Based on coverage, precision, and input compatibility with our LinkedIn-slug-first dataset.</p>
        <WaterfallStrategy />
      </div>

      {/* ── LinkedIn-input vendors ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">LinkedIn-input vendors</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These vendors accept a LinkedIn URL or slug — they can run on all 982 contacts with a slug.
          Email bars are split by type: blue = work, purple = personal.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...linkedInVendors]
            .sort((a, b) => (b.emailCoverage ?? -1) - (a.emailCoverage ?? -1))
            .map(v => (
              <VendorCard key={v.id} v={v}  />
            ))}
        </div>
      </div>

      {/* ── Name+domain vendors ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-base font-semibold">Name+domain vendors</h2>
          <span className="text-xs px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-orange-700 font-medium">Capped at 142/1,000 contacts</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Require first name + last name + company domain. Only 142/1,000 contacts have all three.
          Low numbers reflect the input constraint, not quality.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {nameDomainVendors.map(v => (
            <VendorCard key={v.id} v={v}  />
          ))}
        </div>
      </div>

      {/* ── Not yet evaluated ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-3">Not yet evaluated ({pendingVendors.length} vendors)</h2>
        <div className="flex flex-wrap gap-2">
          {pendingVendors.map(v => (
            <span
              key={v.name}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-medium ${typeFilter[v.type]}`}
            >
              {v.name}
              <span className="opacity-60">{typeLabel[v.type]}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
