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
  emailCoverage: number | null        // /1000
  phoneCoverage: number | null        // /134
  wfRescueEmail: number | null
  combinedEmail: number | null
  recall: number | null
  precisionLabel: string | null
  latencyLabel: string | null
  notionUrl: string | null
  commentary: string
  waterfallNote?: string              // where this fits in the waterfall
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Dataset: 1,000 contacts, primary ID = LinkedIn slug
// Waterfall baseline: 472 emails found, 71 phones found (from 134-contact phone subset)
// Name+domain vendors: only 142/1,000 contacts have name+domain — capped at 14.2%

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
    phoneCoverage: 40,
    wfRescueEmail: 200,
    combinedEmail: 673,
    recall: 93.5,
    precisionLabel: "100% VALID",
    latencyLabel: "~1,022ms avg (sync)",
    notionUrl: "https://app.notion.com/p/34fd5e4e099a8189a9a1c52feaf73b57",
    commentary: "Highest match rate (87.3%) and 100% VALID precision — but 470/474 emails are personal (webmail), only 20 are work. Not a work email source despite the headline coverage. Best use case: personal email enrichment and identity resolution. 93.5% recall vs WF-confirmed contacts.",
    waterfallNote: "Strong P1 for personal email. Not a work email source — pair with Limadata for work email coverage.",
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
    phoneCoverage: 101,
    wfRescueEmail: 311,
    combinedEmail: 786,
    recall: 88.0,
    precisionLabel: "No signal (V2 batch)",
    latencyLabel: "~195ms avg (phone); ~7min (work email batch)",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81dcb828c9c18251b5a2",
    commentary: "Best phone coverage (101/134, 75.4%) and highest recall (88.0%). Email coverage of 721 is any-email (work + personal combined) — work email alone is 373 (37.3%), which trails Waterfall. Dominant personal email source at 62.5%. Two API keys required (work vs. personal billed separately). Work email batch is slow (~7 min for 1,000 contacts).",
    waterfallNote: "Best-in-class for phone and personal email. Not a work-email replacement — use for phone-first or personal email enrichment.",
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
    phoneCoverage: 84,
    wfRescueEmail: 57,
    combinedEmail: 529,
    recall: 80.0,
    precisionLabel: "100% VERIFIED",
    latencyLabel: "~449ms avg (bulk, 50/batch)",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81399eb6dca318edca2d",
    commentary: "Re-eval after account upgrade — 728/1,000 matched. Best-in-class email precision: 100% VERIFIED on all 283 returned emails (zero CATCHALL or RISKY). Strong phone (84/134, 62.7%). Email coverage is conservative (28.3%) because Prospeo only returns emails it is highly confident in. Uses bulk endpoint (50/batch, synchronous).",
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
    phoneCoverage: 38,
    wfRescueEmail: 121,
    combinedEmail: 596,
    recall: 76.2,
    precisionLabel: "No signal (email or 404)",
    latencyLabel: "~200ms avg targeted (async batch)",
    notionUrl: "https://app.notion.com/p/350d5e4e099a81d88e99f345e2a1d1a3",
    commentary: "Strong work email coverage (480/1,000, 48%) with 76.2% recall. Rescued 121 contacts Waterfall missed. No email validity signal — you get an email or nothing. Tail latency issue (~5% of requests hit 10–22s) flagged with vendor.",
    waterfallNote: "Strong P1 for work email volume. Pair with Forager for precision or ContactOut for phone.",
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
    phoneCoverage: 0,
    wfRescueEmail: 223,
    combinedEmail: 698,
    recall: 64.0,
    precisionLabel: "No signal (work + personal mixed)",
    latencyLabel: "Async batch (100/call)",
    notionUrl: null,
    commentary: "527 emails returned (184 work, 326 personal, 17 student) — headline coverage is inflated vs. pure-work vendors. Best combined email coverage at 69.8% when added to Waterfall. No phone. Work/personal type available in response for post-filtering.",
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
    matchRate: 46.1,
    emailCoverage: 339,
    phoneCoverage: 38,
    wfRescueEmail: 127,
    combinedEmail: 600,
    recall: 48.2,
    precisionLabel: "90% VALID (7 risky, 26 unknown)",
    latencyLabel: "~205ms avg ⚡",
    notionUrl: "https://www.notion.so/unifygtm/34fd5e4e099a81f3b141f3c96cffcdc3",
    commentary: "Returns both work (275/1,000) and personal (230/1,000) emails — 339 total with some overlap. 90% VALID; 7 RISKY and 26 UNKNOWN in the remainder. Async with up to 380s resolution time for work email — requires ≥600s poll timeout. Phone (38/134) underperforms Clay's Wiza attribution (287/1,000), likely a data tier gap.",
    waterfallNote: "Speed-first use cases. Moderate email coverage — stronger as a phone or latency layer than primary email source.",
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
    phoneCoverage: 23,
    wfRescueEmail: 69,
    combinedEmail: 542,
    recall: 23.4,
    precisionLabel: "No signal",
    latencyLabel: "~4,853ms avg ⚠️ (p95: 15.8s)",
    notionUrl: "https://app.notion.com/p/350d5e4e099a812da77cf7bd6385b625",
    commentary: "Low match rate (21.9%) and weak email coverage (169/1,000). 90% of email hits are personal (gmail/yahoo) — work email effective coverage is only 8.4% (84/1,000). Latency is a critical concern — avg ~4.8s with p95 at 15.8s and p99 at 24s. Not viable as an inline enrichment source at these speeds. Phone coverage (23/134) is lowest of any vendor tested.",
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
    phoneCoverage: 3,
    wfRescueEmail: 26,
    combinedEmail: 498,
    recall: 12.8,
    precisionLabel: "100% VALID",
    latencyLabel: "Async batch",
    notionUrl: null,
    commentary: "Only 142/1,000 contacts are eligible (requires name+domain). Within those, quality is high — 100% VALID emails. Phone at $50/lookup is cost-prohibitive at scale. Not viable as a primary waterfall vendor for this dataset.",
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
    phoneCoverage: 0,
    wfRescueEmail: 11,
    combinedEmail: 483,
    recall: 18.7,
    precisionLabel: "ultra_sure / probable tiers",
    latencyLabel: "Async",
    notionUrl: null,
    commentary: "Email-only vendor capped by name+domain input (same 142-contact ceiling). Proprietary confidence tiers instead of SMTP verification. Lowest email coverage in the eval.",
    waterfallNote: "Same cap as Enrow — email only, no phone. Limited value for LinkedIn-slug-first workflows.",
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
    phoneCoverage: 0,
    wfRescueEmail: 18,
    combinedEmail: 490,
    recall: 14.5,
    precisionLabel: "50% verified (rest unknown)",
    latencyLabel: "Async batch",
    notionUrl: null,
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
  { name: "RocketReach", type: "phone" },
  { name: "SignalHire", type: "both" },
  { name: "BetterContact", type: "phone" },
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WF_EMAIL = 472
const WF_PHONE = 71

function pct(n: number | null, decimals = 1): string {
  if (n === null) return "—"
  return `${n.toFixed(decimals)}%`
}

function bar(value: number | null, max: number, color: string) {
  if (value === null) return null
  const w = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{value}</span>
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

// ─── Best-in-class cards ──────────────────────────────────────────────────────

function BestInClass() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        {
          label: "Best work email",
          winner: "Limadata",
          stat: "480 / 1,000",
          sub: "48% coverage, 76% recall",
          color: "border-blue-200 bg-blue-50/40",
          badge: "bg-blue-100 text-blue-800",
        },
        {
          label: "Best personal email",
          winner: "Forager",
          stat: "470 / 1,000",
          sub: "87% match, 100% VALID",
          color: "border-purple-200 bg-purple-50/40",
          badge: "bg-purple-100 text-purple-800",
        },
        {
          label: "Best phone",
          winner: "ContactOut",
          stat: "101 / 134",
          sub: "75.4% of phone subset",
          color: "border-orange-200 bg-orange-50/40",
          badge: "bg-orange-100 text-orange-800",
        },
        {
          label: "Best combined email",
          winner: "ContactOut",
          stat: "786 / 1,000",
          sub: "Work + personal, 88% recall",
          color: "border-violet-200 bg-violet-50/40",
          badge: "bg-violet-100 text-violet-800",
        },
      ].map(c => (
        <div key={c.label} className={`rounded-lg border p-4 ${c.color}`}>
          <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
          <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mb-2 ${c.badge}`}>{c.winner}</div>
          <div className="text-lg font-bold tabular-nums leading-tight">{c.stat}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Waterfall strategy panel ─────────────────────────────────────────────────

function WaterfallStrategy() {
  const rows = [
    {
      position: "P1 — Work email",
      vendor: "Limadata",
      why: "Highest work email coverage (480/1,000) with 76% recall. LinkedIn URL input — works on 982/1,000 contacts. No validity signal but targeted endpoint returns email-or-nothing.",
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
      why: "Best phone coverage (101/134, 75.4%) and best personal email source (625/1,000). 88% recall. Two keys required (work + personal billed separately). Work email batch is slow (~7 min).",
      pill: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      position: "P3 — High-precision email layer",
      vendor: "Prospeo",
      why: "100% VERIFIED on all returned emails — zero CATCHALL or RISKY. 72.8% match rate, 80% recall. Use when precision matters more than volume (e.g. outbound sequences).",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      position: "Speed-first / async phone",
      vendor: "Wiza",
      why: "205ms avg — fastest vendor. Moderate email (339/1,000, 90% VALID). Phone underperforms Clay's internal Wiza attribution — worth investigating data tier access.",
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

function VendorCard({ v, emailMax, phoneMax }: { v: VendorEvalResult; emailMax: number; phoneMax: number }) {
  const isFailed = v.status === "failed"

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
            {pct(v.matchRate, 0)}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4 space-y-3">
        {/* Email */}
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-muted-foreground font-medium">Email coverage</span>
            <span className="text-muted-foreground">vs. WF {WF_EMAIL}</span>
          </div>
          {bar(v.emailCoverage, emailMax, "bg-blue-400")}
          {v.wfRescueEmail !== null && (
            <div className="text-xs text-muted-foreground mt-1">
              Rescued <span className="font-medium text-foreground">{v.wfRescueEmail}</span> WF misses ·{" "}
              Combined <span className="font-medium text-foreground">{v.combinedEmail}</span> with WF
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-muted-foreground font-medium">Phone coverage</span>
            <span className="text-muted-foreground">134-contact subset · WF {WF_PHONE}</span>
          </div>
          {v.phone
            ? bar(v.phoneCoverage, phoneMax, "bg-orange-400")
            : <div className="text-xs text-muted-foreground mt-0.5 italic">Not offered</div>
          }
        </div>

        {/* Recall + Precision */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Recall vs. WF baseline</div>
            <div className={`text-sm font-semibold tabular-nums ${v.recall === null ? "text-muted-foreground" : v.recall >= 70 ? "text-emerald-700" : v.recall >= 40 ? "text-amber-700" : "text-red-600"}`}>
              {pct(v.recall)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Precision</div>
            <div className="text-sm font-medium text-foreground">{v.precisionLabel ?? "—"}</div>
          </div>
        </div>

        {/* Latency */}
        <div className="text-xs text-muted-foreground pt-0.5">
          <span className="font-medium text-foreground">Latency:</span> {v.latencyLabel ?? "—"} ·{" "}
          <span className="font-medium text-foreground">Input:</span>{" "}
          {v.inputMethod === "linkedin-url" ? "LinkedIn URL" : v.inputMethod === "linkedin-slug" ? "LinkedIn slug" : "Name + domain"}
        </div>
      </div>

      {/* Commentary */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">{v.commentary}</p>
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
  const emailMax = Math.max(...[...linkedInVendors, ...nameDomainVendors].map(v => v.emailCoverage ?? 0), WF_EMAIL)
  const phoneMax = Math.max(...[...linkedInVendors, ...nameDomainVendors].map(v => v.phoneCoverage ?? 0), WF_PHONE)

  const typeFilter: Record<string, string> = {
    both: "bg-slate-100 text-slate-700 border-slate-200",
    email: "bg-blue-50 text-blue-700 border-blue-200",
    phone: "bg-orange-50 text-orange-700 border-orange-200",
  }
  const typeLabel: Record<string, string> = { both: "Email + Phone", email: "Email", phone: "Phone" }

  return (
    <div className="space-y-10">

      {/* ── Context strip ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/20 px-5 py-4 text-sm space-y-1.5">
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
            <span className="font-medium">⚠ Name+domain vendors</span>{" "}
            <span className="text-muted-foreground">only reach 142/1,000 contacts (14.2%). Their numbers reflect that ceiling, not quality.</span>
          </div>
        </div>
      </div>

      {/* ── Best in class ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-3">Best in class</h2>
        <BestInClass />
      </div>

      {/* ── Waterfall strategy ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">Where each vendor fits in the waterfall</h2>
        <p className="text-sm text-muted-foreground mb-3">Based on coverage, precision, and input compatibility with our LinkedIn-slug-first dataset.</p>
        <WaterfallStrategy />
      </div>

      {/* ── LinkedIn-input vendors (full dataset) ─────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-1">LinkedIn-input vendors</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These vendors accept a LinkedIn URL or slug — they can run on all 982 contacts with a slug.
          Sorted by email coverage.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...linkedInVendors]
            .sort((a, b) => (b.emailCoverage ?? -1) - (a.emailCoverage ?? -1))
            .map(v => (
              <VendorCard key={v.id} v={v} emailMax={emailMax} phoneMax={phoneMax} />
            ))}
        </div>
      </div>

      {/* ── Name+domain vendors (capped dataset) ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-base font-semibold">Name+domain vendors</h2>
          <span className="text-xs px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-orange-700 font-medium">⚠ Capped at 142/1,000 contacts</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These vendors require first name + last name + company domain — only 142/1,000 contacts in our dataset have all three.
          Low coverage numbers reflect the input constraint, not poor quality. Only worth evaluating if we shift to a name+domain-first workflow.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {nameDomainVendors.map(v => (
            <VendorCard key={v.id} v={v} emailMax={emailMax} phoneMax={phoneMax} />
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
