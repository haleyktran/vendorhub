import * as React from "react"
import { vendorContacts } from "@/vendorHubData"
import { vendorCommercialData, type CommitmentTier, type Capability } from "@/vendorCommercialData"
import { useLocalOverrides, makeShareUrl, type CommercialOverride } from "@/hooks/useLocalOverrides"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Clock, CheckCircle2, AlertCircle, User, Pencil, RotateCcw, ExternalLink, Share2 } from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────────────────

const COMMIT_TIERS: Array<{ value: CommitmentTier | ""; label: string }> = [
  { value: "",     label: "TBD" },
  { value: "none", label: "✅ No commit" },
  { value: "low",  label: "⚠️ Low ($2K–$25K)" },
  { value: "high", label: "❌ High ($50K+)" },
]

const CAPABILITIES: Array<{ value: Capability | ""; label: string }> = [
  { value: "",                    label: "TBD" },
  { value: "finds-enrich",        label: "Finds + enrich" },
  { value: "enrich-only",         label: "Enrich only" },
  { value: "dataset",             label: "Buy dataset" },
  { value: "finds-enrich-dataset",label: "Finds + enrich + dataset" },
  { value: "platform",            label: "Platform" },
]

const STATUSES: Array<{ value: "ready" | "wait" | "blocked" | "tbd"; label: string }> = [
  { value: "ready",   label: "🟢 Ready" },
  { value: "wait",    label: "🟡 In motion" },
  { value: "blocked", label: "🔴 Blocked" },
  { value: "tbd",     label: "⚪ TBD" },
]

// ─── inline edit primitives ────────────────────────────────────────────────────

function EditableText({
  value, onSave, className = "", multiline = false, placeholder = "Add note…",
}: {
  value: string
  onSave: (v: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const ref = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  React.useEffect(() => { setDraft(value) }, [value])
  React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) onSave(draft.trim())
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); commit() }
        if (e.key === "Escape") { setEditing(false); setDraft(value) }
      },
      placeholder,
      className: `w-full text-xs border border-violet-400 rounded px-1.5 py-1 bg-white outline-none ring-1 ring-violet-300 ${className}`,
    }
    return multiline
      ? <textarea {...shared} rows={3} className={shared.className + " resize-none"} />
      : <input {...shared} />
  }

  return (
    <span
      className={`group/edit relative inline-flex items-start gap-1 cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors ${className}`}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      <span className="flex-1">{value || <span className="text-muted-foreground italic">{placeholder}</span>}</span>
      <Pencil className="h-2.5 w-2.5 text-violet-400 opacity-0 group-hover/edit:opacity-100 mt-0.5 flex-shrink-0 transition-opacity" />
    </span>
  )
}

function EditableSelect<T extends string>({
  value, options, onSave, className = "",
}: {
  value: T | null
  options: Array<{ value: T | ""; label: string }>
  onSave: (v: T | null) => void
  className?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const ref = React.useRef<HTMLSelectElement>(null)
  React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  if (editing) {
    return (
      <select
        ref={ref}
        defaultValue={value ?? ""}
        autoFocus
        onChange={e => {
          const v = e.target.value as T | ""
          onSave(v === "" ? null : v)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        className="text-xs border border-violet-400 rounded px-1 py-0.5 bg-white outline-none ring-1 ring-violet-300"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  const current = options.find(o => o.value === (value ?? ""))
  return (
    <span
      className={`group/edit inline-flex items-center gap-1 cursor-pointer hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors ${className}`}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      <span className="text-xs">{current?.label ?? "TBD"}</span>
      <Pencil className="h-2.5 w-2.5 text-violet-400 opacity-0 group-hover/edit:opacity-100 flex-shrink-0 transition-opacity" />
    </span>
  )
}

// ─── status pill (inline dropdown) ────────────────────────────────────────────

const STATUS_STYLES = {
  ready:   { pill: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200", label: "🟢 Ready" },
  wait:    { pill: "bg-amber-100   text-amber-800   border-amber-300   hover:bg-amber-200",   label: "🟡 In motion" },
  blocked: { pill: "bg-red-100     text-red-800     border-red-300     hover:bg-red-200",     label: "🔴 Blocked" },
  tbd:     { pill: "bg-gray-100    text-gray-600    border-gray-300    hover:bg-gray-200",    label: "⚪ TBD" },
}

const MENU_STYLES: Record<string, string> = {
  ready:   "hover:bg-emerald-50 text-emerald-800",
  wait:    "hover:bg-amber-50   text-amber-800",
  blocked: "hover:bg-red-50     text-red-800",
  tbd:     "hover:bg-gray-50    text-gray-600",
}

function StatusPill({
  value, onSave,
}: {
  value: "ready" | "wait" | "blocked" | "tbd"
  onSave: (v: "ready" | "wait" | "blocked" | "tbd") => void
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cfg = STATUS_STYLES[value] ?? STATUS_STYLES.tbd

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center gap-0.5 text-[10px] font-medium border rounded-full px-2 py-0.5 transition-colors cursor-pointer ${cfg.pill}`}
        title="Click to change status"
      >
        {cfg.label}
        <ChevronDown className={`h-2.5 w-2.5 opacity-60 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                onSave(s.value as "ready" | "wait" | "blocked" | "tbd")
                setOpen(false)
              }}
              className={`w-full text-left text-[11px] px-3 py-1.5 cursor-pointer transition-colors ${MENU_STYLES[s.value] ?? ""} ${s.value === value ? "font-semibold" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── sub-components ────────────────────────────────────────────────────────────

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
      <TableCell colSpan={8} className="p-0">
        <div className={`px-4 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.text} border-y ${cfg.border}`}>
          {cfg.label}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── share button ─────────────────────────────────────────────────────────────

function ShareButton({ overrides }: { overrides: Record<string, CommercialOverride> }) {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    const url = makeShareUrl(overrides)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 border border-violet-200 hover:border-violet-400 rounded-md px-2.5 py-1 transition-colors bg-violet-50 hover:bg-violet-100"
    >
      <Share2 className="h-3 w-3" />
      {copied ? "Link copied!" : "Copy share link"}
    </button>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

export function CommercialHub() {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const { overrides, setField, resetVendor, hasOverrides } = useLocalOverrides()

  const toggle = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const merged = (vendorId: string, base: typeof vendorCommercialData[string] | null) => {
    const o = overrides[vendorId] ?? {}
    return base ? { ...base, ...o } : (Object.keys(o).length ? o as unknown as typeof base : null)
  }

  const rows = vendorContacts
    .filter(v => v.overallStatus !== "do-not-contact")
    .map(v => {
      const base = vendorCommercialData[v.id] ?? null
      const comm = merged(v.id, base)
      const statusOverride = (overrides[v.id] as CommercialOverride)?.commercialStatus
      const section = (statusOverride !== undefined ? statusOverride : v.commercialStatus) ?? "tbd"
      return { vendor: v, commercial: comm, section: section as "ready" | "wait" | "blocked" | "tbd" }
    })
    .sort((a, b) => {
      const order = { ready: 0, wait: 1, blocked: 2, tbd: 3 }
      return (order[a.section] ?? 3) - (order[b.section] ?? 3)
    })

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
          { label: "Ready now",             value: readyCount,   color: "text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-emerald-50" },
          { label: "In motion",             value: waitCount,    color: "text-amber-700",   icon: <Clock className="h-4 w-4" />,        bg: "bg-amber-50"   },
          { label: "Blocked / depr.",       value: blockedCount, color: "text-red-700",     icon: <AlertCircle className="h-4 w-4" />,  bg: "bg-red-50"     },
          { label: "✅ PAYG / no commit",   value: paygCount,    color: "text-emerald-700", icon: <DollarSign className="h-4 w-4" />,   bg: "bg-emerald-50" },
          { label: "❌ High commit ($50K+)", value: highCount,   color: "text-red-700",     icon: <DollarSign className="h-4 w-4" />,   bg: "bg-red-50"     },
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
          <p className="text-muted-foreground">Harmonic ($10K), Dealroom (€12K/yr), Crustdata ($4K/mo), HitHorizons (€3.5K/60K), Store Leads ($25K), Beauhurst (£20–40K)</p>
        </div>
        <div>
          <p className="font-semibold text-red-700 mb-1">❌ High commit ($50K+)</p>
          <p className="text-muted-foreground">Crunchbase ($150K), PitchBook (~$160K), CB Insights (6-fig), Spade (6-fig), SimilarWeb ($50K+), Openmart ($80K), Explorium ($60K)</p>
        </div>
      </div>

      {/* Edit hint + share */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Pencil className="h-3 w-3" />
          Click any field to edit inline — changes are saved locally in your browser.
          Expand a row to edit pricing detail and move vendors between sections.
        </p>
        <ShareButton overrides={overrides} />
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
              <TableHead className="w-[80px]">Eval Doc</TableHead>
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
                    const edited = hasOverrides(vendor.id)
                    const tier = commercial?.commitmentTier ?? null
                    const tierLabel = commercial?.commitmentLabel ?? "TBD"

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

                          {/* vendor + edited indicator */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm">{vendor.name}</span>
                              {edited && (
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" title="Locally edited" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {vendor.tier && <span className="font-medium text-foreground mr-1">{vendor.tier}</span>}
                              {vendor.category.split(" · ")[0]}
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                              <StatusPill
                                value={section}
                                onSave={v => setField(vendor.id, "commercialStatus", v as any)}
                              />
                            </div>
                          </TableCell>

                          {/* commit tier — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <div className="space-y-0.5">
                              <EditableSelect<CommitmentTier>
                                value={tier}
                                options={COMMIT_TIERS as any}
                                onSave={v => setField(vendor.id, "commitmentTier", v as CommitmentTier | null)}
                              />
                              {tier && (
                                <EditableText
                                  value={tierLabel}
                                  onSave={v => setField(vendor.id, "commitmentLabel", v)}
                                  className="text-[10px] text-muted-foreground block"
                                  placeholder="e.g. $25K/yr"
                                />
                              )}
                            </div>
                          </TableCell>

                          {/* pricing tldr — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableText
                              value={commercial?.pricingTldr ?? ""}
                              onSave={v => setField(vendor.id, "pricingTldr", v)}
                              className="text-xs leading-snug text-foreground"
                              placeholder="Add pricing summary…"
                            />
                          </TableCell>

                          {/* capability — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableSelect<Capability>
                              value={commercial?.capability ?? null}
                              options={CAPABILITIES as any}
                              onSave={v => setField(vendor.id, "capability", v as Capability | null)}
                            />
                          </TableCell>

                          {/* next step — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableText
                              value={commercial?.commercialNextStep ?? ""}
                              onSave={v => setField(vendor.id, "commercialNextStep", v)}
                              className="text-xs leading-snug text-foreground"
                              placeholder="Add next step…"
                            />
                          </TableCell>

                          {/* owner — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableSelect<"haley" | "will">
                              value={commercial?.commercialOwner ?? null}
                              options={[
                                { value: "", label: "—" },
                                { value: "haley", label: "Haley" },
                                { value: "will",  label: "Will" },
                              ] as any}
                              onSave={v => setField(vendor.id, "commercialOwner", v as "haley" | "will" | null)}
                            />
                          </TableCell>

                          {/* eval doc — link or editable URL */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            {(() => {
                              const url = (overrides[vendor.id] as CommercialOverride)?.questionnaireUrl ?? commercial?.questionnaireUrl
                              return url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 hover:underline font-medium"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open
                                </a>
                              ) : (
                                <EditableText
                                  value=""
                                  onSave={v => setField(vendor.id, "questionnaireUrl", v)}
                                  className="text-[11px] text-muted-foreground"
                                  placeholder="Paste URL…"
                                />
                              )
                            })()}
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail panel */}
                        {expanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="p-0">
                              <div className={`px-6 py-4 border-t space-y-3 ${
                                section === "ready"   ? "bg-emerald-50/40" :
                                section === "wait"    ? "bg-amber-50/40" :
                                section === "blocked" ? "bg-red-50/30" : "bg-muted/20"
                              }`}>
                                <div className="grid grid-cols-2 gap-6">
                                  {/* Left: pricing detail — editable */}
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pricing detail</p>
                                    <EditableText
                                      value={commercial?.pricingDetail ?? commercial?.pricingTldr ?? ""}
                                      onSave={v => setField(vendor.id, "pricingDetail", v)}
                                      className="text-sm text-foreground leading-relaxed block w-full"
                                      multiline
                                      placeholder="Add detailed pricing notes…"
                                    />
                                  </div>

                                  {/* Right: meta + status move */}
                                  <div className="space-y-3">
                                    {/* Move section */}
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Commercial status</p>
                                      <EditableSelect<"ready" | "wait" | "blocked" | "tbd">
                                        value={section}
                                        options={STATUSES as any}
                                        onSave={v => setField(vendor.id, "commercialStatus", v as any)}
                                      />
                                    </div>

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

                                    {/* Signal context */}
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Signal overview</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">{vendor.signal}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Next step highlight + reset */}
                                <div className="border-t pt-3 flex items-start gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap mt-0.5">Next step:</span>
                                  <p className="text-sm font-medium text-foreground flex-1">
                                    {commercial?.commercialNextStep || <span className="text-muted-foreground italic text-xs">Click the next step cell above to add one</span>}
                                  </p>
                                  {commercial?.commercialOwner && (
                                    <span className="flex-shrink-0 mt-0.5">
                                      <OwnerChip owner={commercial.commercialOwner} />
                                    </span>
                                  )}
                                  {hasOverrides(vendor.id) && (
                                    <button
                                      onClick={e => { e.stopPropagation(); resetVendor(vendor.id) }}
                                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-600 transition-colors ml-auto flex-shrink-0"
                                      title="Reset all local edits for this vendor"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      Reset edits
                                    </button>
                                  )}
                                </div>
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
        <span className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-400 inline-block" /> locally edited</span>
          <span className="bg-violet-100 text-violet-800 border border-violet-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">Haley</span>
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">Will</span>
        </span>
      </div>
    </div>
  )
}
