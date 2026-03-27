import * as React from "react"
import { vendorContacts } from "@/vendorHubData"
import { vendorCommercialData, type CommitmentTier, type Capability } from "@/vendorCommercialData"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle, User } from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────────────────

const COMMIT_CONFIG: Record<CommitmentTier, { label: string; color: string; bg: string; dot: string }> = {
  none: { label: "✅ No commit",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
  low:  { label: "⚠️ Low",        color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     dot: "bg-amber-400"   },
  high: { label: "❌ High",       color: "text-red-700",     bg: "bg-red-50 border-red-200",         dot: "bg-red-400"     },
}

const CAP_LABELS: Record<Capability, string> = {
  "finds-enrich":         "Finds + enrich",
  "enrich-only":          "Enrich only",
  "dataset":              "Buy dataset",
  "finds-enrich-dataset": "Finds + enrich + dataset",
  "platform":             "Platform",
}

function CommitBadge({ tier, label }: { tier: CommitmentTier | null; label: string }) {
  if (!tier) return <span className="text-xs text-muted-foreground">TBD</span>
  const cfg = COMMIT_CONFIG[tier]
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function CapBadge({ cap }: { cap: Capability | null }) {
  if (!cap) return <span className="text-xs text-muted-foreground">TBD</span>
  const variantMap: Record<Capability, "green" | "yellow" | "purple" | "gray"> = {
    "finds-enrich":         "green",
    "enrich-only":          "yellow",
    "dataset":              "purple",
    "finds-enrich-dataset": "green",
    "platform":             "gray",
  }
  return <Badge variant={variantMap[cap]} className="text-[10px] whitespace-nowrap">{CAP_LABELS[cap]}</Badge>
}

function OwnerChip({ owner }: { owner: "haley" | "will" | null }) {
  if (!owner) return null
  const styles = {
    haley: "bg-violet-100 text-violet-800 border-violet-200",
    will:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  }
  return (
    <span className={`text-[10px] font-medium rounded-full border px-1.5 py-0.5 ${styles[owner]}`}>
      {owner === "haley" ? "Haley" : "Will"}
    </span>
  )
}

function StatusSection({ status }: { status: "ready" | "wait" | "blocked" | "tbd" }) {
  const map = {
    ready:   { label: "🟢 Ready to start commercial conversation",    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
    wait:    { label: "🟡 In motion — follow-up or proposal pending", bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800"   },
    blocked: { label: "🔴 Blocked / Deprioritized",                   bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800"     },
    tbd:     { label: "⚪ Upcoming — pricing TBD",                     bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-600"    },
  }
  const cfg = map[status]
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={7} className="p-0">
        <div className={`px-4 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.text} border-y ${cfg.border}`}>
          {cfg.label}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function CommercialHub() {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Merge vendor data with commercial data
  const rows = vendorContacts
    .filter(v => v.overallStatus !== "do-not-contact")
    .map(v => ({
      vendor: v,
      commercial: vendorCommercialData[v.id] ?? null,
      // Derive section from commercialStatus
      section: v.commercialStatus === "ready"   ? "ready"
              : v.commercialStatus === "wait"    ? "wait"
              : v.commercialStatus === "blocked" ? "blocked"
              : "tbd" as "ready" | "wait" | "blocked" | "tbd",
    }))
    .sort((a, b) => {
      const order = { ready: 0, wait: 1, blocked: 2, tbd: 3 }
      return order[a.section] - order[b.section]
    })

  // Stats
  const readyCount   = rows.filter(r => r.section === "ready").length
  const waitCount    = rows.filter(r => r.section === "wait").length
  const blockedCount = rows.filter(r => r.section === "blocked").length
  const paygCount    = rows.filter(r => r.commercial?.commitmentTier === "none").length
  const highCount    = rows.filter(r => r.commercial?.commitmentTier === "high").length

  const sections: Array<"ready" | "wait" | "blocked" | "tbd"> = ["ready", "wait", "blocked", "tbd"]

  return (
    <div className="space-y-6">

      {/* Priority callout */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
        <TrendingUp className="h-4 w-4 text-emerald-700 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            {readyCount} vendor{readyCount !== 1 ? "s" : ""} ready for commercial conversation next week
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Our stated preference: no or low upfront commitment — PAYG and monthly minimums are easiest to trial and walk away from.
            When negotiating, always clarify: (1) reseller/OEM structure, (2) minimum commit at expected volume, (3) dataset vs. API pricing difference.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Ready now",        value: readyCount,   color: "text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-emerald-50" },
          { label: "In motion",        value: waitCount,    color: "text-amber-700",   icon: <Clock className="h-4 w-4" />,        bg: "bg-amber-50"   },
          { label: "Blocked / depr.",  value: blockedCount, color: "text-red-700",     icon: <AlertCircle className="h-4 w-4" />,  bg: "bg-red-50"     },
          { label: "✅ PAYG / no commit", value: paygCount, color: "text-emerald-700", icon: <DollarSign className="h-4 w-4" />,   bg: "bg-emerald-50" },
          { label: "❌ High commit ($50K+)", value: highCount, color: "text-red-700",  icon: <DollarSign className="h-4 w-4" />,   bg: "bg-red-50"     },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${stat.bg}`}>
            <span className={stat.color}>{stat.icon}</span>
            <div>
              <div className={`text-2xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cheat sheet */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3 grid grid-cols-3 gap-4 text-xs">
        <div>
          <p className="font-semibold text-emerald-700 mb-1">✅ No commit / PAYG</p>
          <p className="text-muted-foreground">TheirStack, Adyntel, UpRiver, Serpstat, SE Ranking, The Swarm, BuiltWith, Retention.com</p>
        </div>
        <div>
          <p className="font-semibold text-amber-700 mb-1">⚠️ Low commit ($2K–$25K)</p>
          <p className="text-muted-foreground">Harmonic ($10K), Dealroom (€12K/yr), Crustdata ($4K/mo), HitHorizons (€3.5K/60K), Beauhurst (£20–40K)</p>
        </div>
        <div>
          <p className="font-semibold text-red-700 mb-1">❌ High commit ($50K+)</p>
          <p className="text-muted-foreground">Crunchbase ($150K), PitchBook (~$160K), CB Insights (6-fig), Spade (6-fig), SimilarWeb ($50K+), Openmart ($80K), Explorium ($60K)</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-6"></TableHead>
              <TableHead className="w-[160px]">Vendor</TableHead>
              <TableHead className="w-[130px]">Upfront commit</TableHead>
              <TableHead className="w-[280px]">Pricing TL;DR</TableHead>
              <TableHead className="w-[150px]">Capability</TableHead>
              <TableHead>Next commercial step</TableHead>
              <TableHead className="w-[70px]">Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map(section => {
              const sectionRows = rows.filter(r => r.section === section)
              if (sectionRows.length === 0) return null
              return (
                <React.Fragment key={section}>
                  <StatusSection status={section} />
                  {sectionRows.map(({ vendor, commercial }) => {
                    const expanded = expandedRows.has(vendor.id)
                    const tier = commercial?.commitmentTier ?? null
                    const tierLabel = commercial?.commitmentLabel ?? "TBD"

                    // Row tint by section
                    const rowBg = section === "ready"   ? "hover:bg-emerald-50/60"
                                : section === "wait"    ? "hover:bg-amber-50/60"
                                : section === "blocked" ? "hover:bg-red-50/40"
                                : "hover:bg-muted/30"

                    const leftAccent = section === "ready"   ? "border-l-2 border-l-emerald-400"
                                     : section === "wait"    ? "border-l-2 border-l-amber-400"
                                     : section === "blocked" ? "border-l-2 border-l-red-300"
                                     : ""

                    return (
                      <React.Fragment key={vendor.id}>
                        <TableRow
                          className={`cursor-pointer transition-colors ${rowBg} ${leftAccent}`}
                          onClick={() => toggle(vendor.id)}
                        >
                          {/* expand */}
                          <TableCell className="text-muted-foreground pr-0">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </TableCell>

                          {/* vendor */}
                          <TableCell>
                            <div className="font-semibold text-sm">{vendor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {vendor.tier && <span className="font-medium text-foreground mr-1">{vendor.tier}</span>}
                              {vendor.category.split(" · ")[0]}
                            </div>
                          </TableCell>

                          {/* commit tier */}
                          <TableCell>
                            <CommitBadge tier={tier} label={tierLabel} />
                          </TableCell>

                          {/* pricing tldr */}
                          <TableCell>
                            <p className="text-xs leading-snug text-foreground line-clamp-2">
                              {commercial?.pricingTldr ?? <span className="text-muted-foreground">TBD</span>}
                            </p>
                          </TableCell>

                          {/* capability */}
                          <TableCell>
                            <CapBadge cap={commercial?.capability ?? null} />
                          </TableCell>

                          {/* next step */}
                          <TableCell>
                            <p className="text-xs leading-snug text-foreground line-clamp-2">
                              {commercial?.commercialNextStep ?? <span className="text-muted-foreground">TBD</span>}
                            </p>
                          </TableCell>

                          {/* owner */}
                          <TableCell>
                            <OwnerChip owner={commercial?.commercialOwner ?? null} />
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail panel */}
                        {expanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="p-0">
                              <div className={`px-6 py-4 border-t space-y-3 ${
                                section === "ready"   ? "bg-emerald-50/40" :
                                section === "wait"    ? "bg-amber-50/40" :
                                section === "blocked" ? "bg-red-50/30" : "bg-muted/20"
                              }`}>
                                <div className="grid grid-cols-2 gap-6">
                                  {/* Left: pricing detail */}
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pricing detail</p>
                                    <p className="text-sm text-foreground leading-relaxed">
                                      {commercial?.pricingDetail ?? commercial?.pricingTldr ?? "No pricing detail available yet."}
                                    </p>
                                  </div>

                                  {/* Right: meta */}
                                  <div className="space-y-3">
                                    {/* Contacts */}
                                    {vendor.contacts.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contacts</p>
                                        <div className="space-y-0.5">
                                          {vendor.contacts.map((c, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                                              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                              <span>{c}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Capability */}
                                    {commercial?.capability && (
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Enrichment model</p>
                                        <p className="text-xs text-foreground">{CAP_LABELS[commercial.capability]}</p>
                                      </div>
                                    )}

                                    {/* Signal context */}
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Signal overview</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{vendor.signal}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Next step highlight */}
                                {commercial?.commercialNextStep && (
                                  <div className="border-t pt-3 flex items-start gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap mt-0.5">Next step:</span>
                                    <p className="text-sm font-medium text-foreground">{commercial.commercialNextStep}</p>
                                    {commercial.commercialOwner && (
                                      <span className="flex-shrink-0 mt-0.5">
                                        <OwnerChip owner={commercial.commercialOwner} />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground border-t pt-3">
        <span>✅ No commit — PAYG or monthly, no advance required</span>
        <span>⚠️ Low — $2K–$25K upfront, manageable</span>
        <span>❌ High — $50K+ upfront, requires scrutiny</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="bg-violet-100 text-violet-800 border border-violet-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">Haley</span>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">Will</span>
        </span>
      </div>
    </div>
  )
}
