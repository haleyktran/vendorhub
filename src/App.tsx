import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { summaryData, tierData, burstData, runLog, type Status } from "./data"
import { VendorHub } from "@/components/VendorHub"
import { CommercialHub } from "@/components/CommercialHub"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function latencyColor(val: number | null): string {
  if (val === null) return ""
  if (val < 300) return "text-emerald-700 font-medium"
  if (val < 1000) return "text-amber-700"
  if (val < 2000) return "text-orange-700"
  return "text-red-700 font-medium"
}

function LatencyCell({ val }: { val: number | null }) {
  return (
    <TableCell className={`text-right tabular-nums ${latencyColor(val)}`}>
      {val === null ? <span className="text-muted-foreground">—</span> : `${val.toLocaleString()}ms`}
    </TableCell>
  )
}

function statusBadge(status: Status) {
  const map: Record<Status, { label: string; variant: "green" | "yellow" | "red" | "gray" | "purple" }> = {
    ready:   { label: "✓ Ready",   variant: "green" },
    caution: { label: "⚠ Caution", variant: "yellow" },
    blocker: { label: "✕ Blocker", variant: "red" },
    pending: { label: "· Pending", variant: "gray" },
    async:   { label: "~ Async",   variant: "purple" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function confidenceDot(c: string) {
  const map: Record<string, string> = {
    high:   "bg-emerald-400",
    medium: "bg-amber-400",
    low:    "bg-orange-400",
    none:   "bg-gray-300",
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${map[c]}`} />
      <span className="capitalize text-xs text-muted-foreground">{c}</span>
    </span>
  )
}

// ─── Summary tab ──────────────────────────────────────────────────────────────

function SummaryTab() {
  const vendors = Array.from(new Set(summaryData.map(r => r.vendor)))

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[130px]">Vendor</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Warm avg</TableHead>
              <TableHead className="text-right">p50</TableHead>
              <TableHead className="text-right">p95</TableHead>
              <TableHead className="text-right">Cold avg</TableHead>
              <TableHead>Rate limit</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(vendor => {
              const rows = summaryData.filter(r => r.vendor === vendor)
              return rows.map((row, i) => (
                <TableRow key={`${vendor}-${row.endpoint}`}>
                  {i === 0 && (
                    <TableCell rowSpan={rows.length} className="font-semibold align-top border-r bg-muted/20">
                      {vendor}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground text-xs">{row.endpoint}</TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <LatencyCell val={row.warmAvg} />
                  <LatencyCell val={row.warmP50} />
                  <LatencyCell val={row.warmP95} />
                  <LatencyCell val={row.coldAvg} />
                  <TableCell className="text-xs text-muted-foreground">{row.rateLimit}</TableCell>
                  <TableCell>{confidenceDot(row.confidence)}</TableCell>
                </TableRow>
              ))
            })}
          </TableBody>
        </Table>
      </div>

      {/* Notes */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-2 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
          Notes
        </div>
        <div className="divide-y">
          {summaryData.filter(r => r.notes).map(row => (
            <div key={`note-${row.vendor}-${row.endpoint}`} className="flex gap-3 px-4 py-2.5 text-xs">
              <span className="font-medium text-foreground whitespace-nowrap min-w-[200px]">
                {row.vendor} · {row.endpoint}
              </span>
              <span className="text-muted-foreground">{row.notes}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tier tab ─────────────────────────────────────────────────────────────────

function TierTab() {
  type TierKey = "large" | "mid" | "small" | "bootstrapped" | "intl"
  const tiers: { key: TierKey; label: string }[] = [
    { key: "large",       label: "Large" },
    { key: "mid",         label: "Mid" },
    { key: "small",       label: "Small" },
    { key: "bootstrapped",label: "Bootstrap" },
    { key: "intl",        label: "Intl" },
  ]
  const vendors = Array.from(new Set(tierData.map(r => r.vendor)))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Cold start avg (ms) per company size tier. A large spread between tiers means the vendor caches popular companies —
        smaller, less-known accounts pay a higher latency penalty.
      </p>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Vendor</TableHead>
              <TableHead>Endpoint</TableHead>
              {tiers.map(t => (
                <TableHead key={t.key} className="text-right">{t.label}</TableHead>
              ))}
              <TableHead className="text-right">Spread</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(vendor => {
              const rows = tierData.filter(r => r.vendor === vendor)
              return rows.map((row, i) => {
                const vals = tiers.map(t => row[t.key]).filter((v): v is number => v !== null)
                const spread = vals.length >= 2 ? Math.max(...vals) - Math.min(...vals) : null
                return (
                  <TableRow key={`${vendor}-${row.endpoint}`}>
                    {i === 0 && (
                      <TableCell rowSpan={rows.length} className="font-semibold align-top border-r bg-muted/20">
                        {vendor}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground text-xs">{row.endpoint}</TableCell>
                    {tiers.map(t => <LatencyCell key={t.key} val={row[t.key]} />)}
                    <TableCell className={`text-right text-xs font-medium ${spread !== null && spread > 1000 ? "text-orange-700" : "text-muted-foreground"}`}>
                      {spread !== null ? `±${spread.toLocaleString()}ms` : "—"}
                    </TableCell>
                  </TableRow>
                )
              })
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Burst tab ────────────────────────────────────────────────────────────────

function BurstTab() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        5 concurrent requests fired simultaneously. Wall time = total wait for user.
        If wall ≈ individual avg, the vendor parallelizes well. If wall &gt; avg, requests are queuing.
      </p>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Vendor</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead className="text-right">Wall time</TableHead>
              <TableHead className="text-right">Ind. avg</TableHead>
              <TableHead className="text-right">Errors / 5</TableHead>
              <TableHead>Parallelizes?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {burstData.map(row => (
              <TableRow key={`${row.vendor}-${row.endpoint}`}>
                <TableCell className="font-semibold">{row.vendor}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.endpoint}</TableCell>
                <LatencyCell val={row.wallMs} />
                <LatencyCell val={row.indAvgMs} />
                <TableCell className={`text-right ${row.errors > 0 ? "text-red-700 font-medium" : "text-muted-foreground"}`}>
                  {row.errors} / 5
                </TableCell>
                <TableCell>
                  {row.parallelizes === null ? (
                    <Badge variant="gray">N/A</Badge>
                  ) : row.parallelizes ? (
                    <Badge variant="green">Yes</Badge>
                  ) : (
                    <Badge variant="yellow">Queues</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Run log tab ──────────────────────────────────────────────────────────────

function RunLogTab() {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Run</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>File / source</TableHead>
            <TableHead>Key findings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runLog.map(run => (
            <TableRow key={run.label}>
              <TableCell className="font-medium whitespace-nowrap">{run.label}</TableCell>
              <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{run.date}</TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px]">{run.file}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{run.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

const VENDOR_STATUS: [string, Status][] = [
  ["SimilarWeb", "ready"],
  ["Openmart",   "caution"],
  ["Adyntel",    "caution"],
  ["SE Ranking", "blocker"],
  ["Crunchbase", "pending"],
  ["BuiltWith",  "pending"],
  ["HG Insights","pending"],
]

type AppView = "latency" | "followups" | "commercial"

export default function App() {
  const [view, setView] = React.useState<AppView>("commercial")

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("followups")}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                view === "followups"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Vendor Follow-ups
            </button>
            <button
              onClick={() => setView("commercial")}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                view === "commercial"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              💰 Commercial
            </button>
            <button
              onClick={() => setView("latency")}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                view === "latency"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Latency Eval
            </button>
          </div>
          <span className="text-xs text-muted-foreground">2026-03-25</span>
        </div>

        {/* ── Vendor Follow-ups view ─────────────────────────────────────────── */}
        {view === "followups" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight mb-1">Vendor Follow-ups</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Your home base for all active vendor conversations — last contact, open emails, signals, and what's next.
                Use this for your daily end-of-day follow-up block.
              </p>
            </div>
            <VendorHub />
          </>
        )}

        {/* ── Commercial view ──────────────────────────────────────────────── */}
        {view === "commercial" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight mb-1">💰 Commercial Brief</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Pricing, upfront commitment, and next commercial steps for every vendor — sorted by readiness.
                Priority this week: push forward commercial conversations with 🟢 Ready vendors.
              </p>
            </div>
            <CommercialHub />
          </>
        )}

        {/* ── Latency Eval view ─────────────────────────────────────────────── */}
        {view === "latency" && (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-1">
                <h1 className="text-2xl font-semibold tracking-tight">Vendor Latency Eval</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Real-time enrichment &amp; signal vendor evaluation for B2B GTM platform.{" "}
                <strong className="text-foreground font-medium">Cold start latency is the primary metric</strong> — most
                user-triggered enrichments will be cold by nature.
              </p>
            </div>

            {/* Vendor status strip */}
            <div className="flex flex-wrap gap-2 mb-8 p-4 rounded-lg border bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground self-center mr-2">Vendors</span>
              {VENDOR_STATUS.map(([vendor, status]) => (
                <div key={vendor} className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm">
                  <span className="font-medium">{vendor}</span>
                  {statusBadge(status)}
                </div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="tiers">By Company Tier</TabsTrigger>
                <TabsTrigger value="burst">Burst Test</TabsTrigger>
                <TabsTrigger value="runs">Run Log</TabsTrigger>
              </TabsList>

              <TabsContent value="summary"><SummaryTab /></TabsContent>
              <TabsContent value="tiers"><TierTab /></TabsContent>
              <TabsContent value="burst"><BurstTab /></TabsContent>
              <TabsContent value="runs"><RunLogTab /></TabsContent>
            </Tabs>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-t pt-4">
              <span><span className="text-emerald-700 font-medium">●</span> &lt;300ms</span>
              <span><span className="text-amber-700">●</span> 300–999ms</span>
              <span><span className="text-orange-700">●</span> 1,000–1,999ms</span>
              <span><span className="text-red-700 font-medium">●</span> ≥2,000ms</span>
              <span className="ml-auto">
                Confidence: <span className="text-emerald-700">●</span> high &nbsp;
                <span className="text-amber-700">●</span> medium &nbsp;
                <span className="text-orange-700">●</span> low
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
