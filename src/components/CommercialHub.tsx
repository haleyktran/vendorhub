import * as React from "react"
import { vendorContacts } from "@/vendorHubData"
import { vendorCommercialData, type CommitmentTier, type Capability, type LegalStatus, type ResellAgreementStatus } from "@/vendorCommercialData"
import { useLocalOverrides, type CommercialOverride } from "@/hooks/useLocalOverrides"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Clock, CheckCircle2, User, Pencil, RotateCcw, ExternalLink, Scale, AlertCircle } from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────────────────

const COMMIT_TIERS: Array<{ value: CommitmentTier | ""; label: string }> = [
  { value: "",       label: "TBD" },
  { value: "none",   label: "✅ No commit / PAYG" },
  { value: "low",    label: "🟡 Low (<$10K)" },
  { value: "medium", label: "⚠️ Medium ($10K–$50K)" },
  { value: "high",   label: "❌ High ($50K+)" },
]

const CAPABILITIES: Array<{ value: Capability | ""; label: string }> = [
  { value: "",                    label: "TBD" },
  { value: "finds-enrich",        label: "Finds + enrich" },
  { value: "enrich-only",         label: "Enrich only" },
  { value: "dataset",             label: "Buy dataset" },
  { value: "finds-enrich-dataset",label: "Finds + enrich + dataset" },
  { value: "platform",            label: "Platform" },
]

const LEGAL_STATUSES: Array<{ value: LegalStatus | ""; label: string }> = [
  { value: "",                 label: "—" },
  { value: "not-started",     label: "⚪ Not started" },
  { value: "nda-out",         label: "📤 NDA out" },
  { value: "nda-signed",      label: "🤝 NDA signed" },
  { value: "contract-review", label: "🔵 Contract review" },
  { value: "contract-signed", label: "✅ Contract signed" },
]

const STATUSES: Array<{ value: "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd"; label: string }> = [
  { value: "ready",     label: "🟢 Ready" },
  { value: "wait",      label: "🟡 In motion" },
  { value: "review",    label: "🔵 Negotiating" },
  { value: "committed", label: "🟣 Committed" },
  { value: "signed",    label: "✅ Signed" },
  { value: "blocked",   label: "🔴 Blocked" },
  { value: "tbd",       label: "⚪ TBD" },
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
      ? <textarea {...shared} rows={2} className={shared.className + " resize-y min-h-[3rem]"} />
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
  ready:     { pill: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200", label: "🟢 Ready" },
  wait:      { pill: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",         label: "🟡 In motion" },
  review:    { pill: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",             label: "🔵 Negotiating" },
  committed: { pill: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",     label: "🟣 Committed" },
  signed:    { pill: "bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200",             label: "✅ Signed" },
  blocked:   { pill: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",                 label: "🔴 Blocked" },
  tbd:       { pill: "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200",             label: "⚪ TBD" },
}

const MENU_STYLES: Record<string, string> = {
  ready:     "hover:bg-emerald-50 text-emerald-800",
  wait:      "hover:bg-amber-50 text-amber-800",
  review:    "hover:bg-blue-50 text-blue-800",
  committed: "hover:bg-purple-50 text-purple-800",
  signed:    "hover:bg-teal-50 text-teal-800",
  blocked:   "hover:bg-red-50 text-red-800",
  tbd:       "hover:bg-gray-50 text-gray-600",
}

function StatusPill({
  value, onSave,
}: {
  value: "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd"
  onSave: (v: "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd") => void
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
        className={`inline-flex items-center gap-0.5 text-[10px] font-medium border rounded-full px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap ${cfg.pill}`}
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
                onSave(s.value as "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd")
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

const OWNER_STYLES: Record<string, string> = {
  haley: "bg-violet-100 text-violet-800 border-violet-200",
  will:  "bg-emerald-100 text-emerald-800 border-emerald-200",
  adl:   "bg-blue-100 text-blue-800 border-blue-200",
}

const OWNER_DISPLAY: Record<string, string> = {
  haley: "Haley",
  will:  "Will",
  adl:   "ADL",
}

function OwnerChip({ owner }: { owner: string | null }) {
  if (!owner) return null
  const key = owner.toLowerCase()
  const style = OWNER_STYLES[key] ?? "bg-gray-100 text-gray-700 border-gray-200"
  const label = OWNER_DISPLAY[key] ?? owner
  return (
    <span className={`text-[10px] font-medium rounded-full border px-1.5 py-0.5 ${style}`}>
      {label}
    </span>
  )
}

const OWNER_PRESETS = ["Haley", "Will", "ADL"]

function EditableOwnerField({
  value, onSave,
}: {
  value: string | null
  onSave: (v: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [customMode, setCustomMode] = React.useState(false)
  const [draft, setDraft] = React.useState(value ?? "")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false); setCustomMode(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  React.useEffect(() => { if (customMode) inputRef.current?.focus() }, [customMode])

  const pick = (v: string | null) => { onSave(v); setOpen(false); setCustomMode(false) }

  const commitCustom = () => {
    const trimmed = draft.trim()
    onSave(trimmed || null)
    setOpen(false); setCustomMode(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <span
        className="group/edit inline-flex items-center gap-1 cursor-pointer rounded px-0.5 -mx-0.5 hover:bg-violet-50 transition-colors"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); setCustomMode(false); setDraft(value ?? "") }}
      >
        {value
          ? <OwnerChip owner={value} />
          : <span className="text-[10px] text-muted-foreground italic">—</span>
        }
        <Pencil className="h-2.5 w-2.5 text-violet-400 opacity-0 group-hover/edit:opacity-100 flex-shrink-0 transition-opacity" />
      </span>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[110px]">
          {!customMode ? (
            <>
              <button
                onMouseDown={e => { e.preventDefault(); pick(null) }}
                className={`w-full text-left text-[11px] px-3 py-1.5 cursor-pointer hover:bg-muted/50 text-muted-foreground ${!value ? "font-semibold bg-muted/30" : ""}`}
              >—</button>
              {OWNER_PRESETS.map(opt => {
                const key = opt.toLowerCase()
                const style = OWNER_STYLES[key] ?? "bg-gray-100 text-gray-700 border-gray-200"
                const isActive = (value ?? "").toLowerCase() === key
                return (
                  <button
                    key={opt}
                    onMouseDown={e => { e.preventDefault(); pick(opt) }}
                    className={`w-full text-left text-[11px] px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${isActive ? "font-semibold bg-muted/30" : ""}`}
                  >
                    <span className={`text-[10px] font-medium rounded-full border px-1.5 py-0.5 ${style}`}>{opt}</span>
                  </button>
                )
              })}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onMouseDown={e => { e.preventDefault(); setCustomMode(true); setDraft(value ?? "") }}
                  className="w-full text-left text-[11px] px-3 py-1.5 cursor-pointer hover:bg-muted/50 text-muted-foreground"
                >Other…</button>
              </div>
            </>
          ) : (
            <div className="px-2 py-1.5">
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); commitCustom() }
                  if (e.key === "Escape") { setCustomMode(false); setDraft(value ?? "") }
                }}
                placeholder="Type name…"
                className="w-full text-xs border border-violet-400 rounded px-1.5 py-1 bg-white outline-none ring-1 ring-violet-300"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusSection({ status }: { status: "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd" }) {
  const map = {
    ready:     { label: "🟢 Ready to start commercial conversation",        bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
    wait:      { label: "🟡 In motion — follow-up or proposal pending",     bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800"   },
    review:    { label: "🔵 Negotiating — pricing proposal / legal review", bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-800"    },
    committed: { label: "🟣 Committed — commercially agreed, finalizing",   bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-800"  },
    signed:    { label: "✅ Signed — contract fully executed",               bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-800"    },
    blocked:   { label: "🔴 Blocked / Deprioritized",                       bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800"     },
    tbd:       { label: "⚪ Upcoming — pricing TBD",                         bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-600"    },
  }
  const cfg = map[status]
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={9} className="p-0">
        <div className={`px-4 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.text} border-y ${cfg.border}`}>
          {cfg.label}
        </div>
      </TableCell>
    </TableRow>
  )
}

// ─── Legal Review tab ──────────────────────────────────────────────────────────

const RESELL_STATUS_CONFIG: Record<ResellAgreementStatus, { label: string; bg: string; border: string; text: string; pill: string; description: string }> = {
  "ready-to-sign": {
    label: "✅ Ready to sign",
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800",
    pill: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Agreement looks good — just needs signatures",
  },
  "sent-redlines": {
    label: "✏️ Sent redlines",
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800",
    pill: "bg-blue-100 text-blue-800 border-blue-300",
    description: "We sent amendments/redlines; waiting on their response",
  },
  "need-to-review": {
    label: "🔍 Need to review",
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800",
    pill: "bg-amber-100 text-amber-800 border-amber-300",
    description: "We have the agreement in hand; need to review it",
  },
  "need-reseller-agreement": {
    label: "📋 Need reseller agreement",
    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800",
    pill: "bg-orange-100 text-orange-800 border-orange-300",
    description: "Don't have an agreement yet; need to request one",
  },
  "do-not-sign": {
    label: "🚫 Do not sign",
    bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600",
    pill: "bg-gray-100 text-gray-600 border-gray-300",
    description: "Decided not to proceed / deprioritized",
  },
}

const RESELL_STATUS_ORDER: ResellAgreementStatus[] = [
  "ready-to-sign",
  "sent-redlines",
  "need-to-review",
  "need-reseller-agreement",
  "do-not-sign",
]

const RESELL_STATUS_OPTIONS: Array<{ value: ResellAgreementStatus | ""; label: string }> = [
  { value: "",                        label: "— Not set" },
  { value: "ready-to-sign",           label: "✅ Ready to sign" },
  { value: "sent-redlines",           label: "✏️ Sent redlines; waiting on response" },
  { value: "need-to-review",          label: "🔍 Need to review" },
  { value: "need-reseller-agreement", label: "📋 Need reseller agreement" },
  { value: "do-not-sign",             label: "🚫 Do not sign" },
]

function ResellStatusPill({
  value, onSave,
}: {
  value: ResellAgreementStatus | null
  onSave: (v: ResellAgreementStatus | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const cfg = value ? RESELL_STATUS_CONFIG[value] : null

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center gap-0.5 text-[10px] font-medium border rounded-full px-2 py-0.5 transition-colors cursor-pointer whitespace-nowrap ${cfg ? cfg.pill : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"}`}
        title="Click to change legal status"
      >
        {cfg ? cfg.label : "— Set status"}
        <ChevronDown className={`h-2.5 w-2.5 opacity-60 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[220px]">
          {RESELL_STATUS_OPTIONS.map(o => (
            <button
              key={o.value}
              onMouseDown={e => {
                e.preventDefault(); e.stopPropagation()
                onSave(o.value === "" ? null : o.value as ResellAgreementStatus)
                setOpen(false)
              }}
              className={`w-full text-left text-[11px] px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${(value ?? "") === o.value ? "font-semibold bg-muted/30" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LegalReviewTab() {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const { overrides, setField } = useLocalOverrides()

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
      const statusOverride = (overrides[v.id] as CommercialOverride)?.resellAgreementStatus
      const resellStatus = (statusOverride !== undefined ? statusOverride : comm?.resellAgreementStatus) ?? null
      return { vendor: v, commercial: comm, resellStatus: resellStatus as ResellAgreementStatus | null }
    })

  // Count by status
  const countBy = (s: ResellAgreementStatus) => rows.filter(r => r.resellStatus === s).length
  const readyCount = countBy("ready-to-sign")
  const redlinesCount = countBy("sent-redlines")
  const reviewCount = countBy("need-to-review")

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3">
        {RESELL_STATUS_ORDER.map(s => {
          const cfg = RESELL_STATUS_CONFIG[s]
          const count = countBy(s)
          return (
            <div key={s} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${cfg.bg}`}>
              <span className={cfg.text}><Scale className="h-4 w-4" /></span>
              <div>
                <div className={`text-2xl font-semibold tabular-nums ${cfg.text}`}>{count}</div>
                <div className="text-xs text-muted-foreground leading-tight">{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Priority callout */}
      {(readyCount + redlinesCount + reviewCount) > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {readyCount > 0 && `${readyCount} ready to sign · `}
              {redlinesCount > 0 && `${redlinesCount} sent redlines (awaiting response) · `}
              {reviewCount > 0 && `${reviewCount} need review`}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Prioritize Committed/Negotiating vendors. Always ensure: (1) IP ownership clause, (2) indemnification language, (3) data accuracy warranty, (4) reseller/redistribution rights.
            </p>
          </div>
        </div>
      )}

      {/* Edit hint */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Pencil className="h-3 w-3" />
        Click the status pill to update legal status. Click a row to expand and edit notes.
      </p>

      {/* Table grouped by resell agreement status */}
      {RESELL_STATUS_ORDER.map(status => {
        const sectionRows = rows.filter(r => r.resellStatus === status)
        if (sectionRows.length === 0) return null
        const cfg = RESELL_STATUS_CONFIG[status]
        return (
          <div key={status} className="space-y-0">
            {/* Section header */}
            <div className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <div className="flex items-center gap-2">
                <span>{cfg.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.pill} border`}>{sectionRows.length}</span>
                <span className="font-normal opacity-70">— {cfg.description}</span>
              </div>
            </div>
            <div className="rounded-b-lg border overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-6"></TableHead>
                    <TableHead className="w-[160px]">Vendor</TableHead>
                    <TableHead className="w-[170px]">Legal status</TableHead>
                    <TableHead className="w-[120px]">Commercial status</TableHead>
                    <TableHead>Legal notes / next step</TableHead>
                    <TableHead className="w-[70px]">Owner</TableHead>
                    <TableHead className="w-[80px]">Contract</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionRows.map(({ vendor, commercial }) => {
                    const expanded = expandedRows.has(vendor.id)
                    const o = overrides[vendor.id] as CommercialOverride | undefined
                    const resellStatus = (o?.resellAgreementStatus !== undefined ? o.resellAgreementStatus : commercial?.resellAgreementStatus) ?? null
                    const legalNotes = (o?.legalNotes !== undefined ? o.legalNotes : commercial?.legalNotes) ?? ""
                    const statusOverride = o?.commercialStatus
                    const section = (statusOverride !== undefined ? statusOverride : vendor.commercialStatus) ?? "tbd"
                    const sectionCfg = STATUS_STYLES[section as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.tbd

                    return (
                      <React.Fragment key={vendor.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/20 transition-colors"
                          onClick={() => toggle(vendor.id)}
                        >
                          <TableCell className="text-muted-foreground pr-0">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{vendor.name}</div>
                            <div className="text-xs text-muted-foreground">{vendor.category.split(" · ")[0]}</div>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <ResellStatusPill
                              value={resellStatus}
                              onSave={v => setField(vendor.id, "resellAgreementStatus" as any, v)}
                            />
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <span className={`inline-flex items-center text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap ${sectionCfg.pill}`}>
                              {sectionCfg.label}
                            </span>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableText
                              value={legalNotes}
                              onSave={v => setField(vendor.id, "legalNotes" as any, v)}
                              className="text-xs leading-snug text-foreground"
                              placeholder="Add legal notes / next step…"
                              multiline
                            />
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableOwnerField
                              value={(o?.commercialOwner !== undefined ? o.commercialOwner : commercial?.commercialOwner) ?? null}
                              onSave={v => setField(vendor.id, "commercialOwner", v)}
                            />
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            {(() => {
                              const url = (o as any)?.contractUrl ?? commercial?.contractUrl
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
                                  onSave={v => setField(vendor.id, "contractUrl" as any, v)}
                                  className="text-[11px] text-muted-foreground"
                                  placeholder="Paste URL…"
                                />
                              )
                            })()}
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-6 py-4 border-t bg-muted/10 space-y-3">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Legal notes</p>
                                    <EditableText
                                      value={legalNotes}
                                      onSave={v => setField(vendor.id, "legalNotes" as any, v)}
                                      className="text-sm text-foreground leading-relaxed block w-full"
                                      multiline
                                      placeholder="Add detailed legal notes…"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Update legal status</p>
                                      <ResellStatusPill
                                        value={resellStatus}
                                        onSave={v => setField(vendor.id, "resellAgreementStatus" as any, v)}
                                      />
                                    </div>
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
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pricing TL;DR</p>
                                      <p className="text-xs text-muted-foreground">{commercial?.pricingTldr ?? "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })}

      {/* Unset vendors */}
      {(() => {
        const unset = rows.filter(r => r.resellStatus === null)
        if (unset.length === 0) return null
        return (
          <div className="space-y-0">
            <div className="px-4 py-2 text-xs font-semibold rounded-t-lg border-t border-x bg-gray-50 text-gray-500 border-gray-200">
              <div className="flex items-center gap-2">
                <span>⬜ Not yet classified</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">{unset.length}</span>
              </div>
            </div>
            <div className="rounded-b-lg border overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[160px]">Vendor</TableHead>
                    <TableHead className="w-[170px]">Set legal status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[70px]">Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unset.map(({ vendor, commercial }) => {
                    const o = overrides[vendor.id] as CommercialOverride | undefined
                    return (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">{vendor.category.split(" · ")[0]}</div>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <ResellStatusPill
                            value={null}
                            onSave={v => setField(vendor.id, "resellAgreementStatus" as any, v)}
                          />
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <EditableText
                            value={o?.legalNotes ?? commercial?.legalNotes ?? ""}
                            onSave={v => setField(vendor.id, "legalNotes" as any, v)}
                            className="text-xs text-foreground"
                            placeholder="Add legal notes…"
                            multiline
                          />
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <EditableOwnerField
                            value={(overrides[vendor.id] as any)?.commercialOwner !== undefined
                              ? (overrides[vendor.id] as any).commercialOwner
                              : commercial?.commercialOwner ?? null}
                            onSave={v => setField(vendor.id, "commercialOwner", v)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── vendor type classification ────────────────────────────────────────────────

const CONTACT_VENDOR_IDS = new Set([
  "snovio", "prospeo", "rocketreach", "contactlevel", "leadiq",
  "lusha", "foragerai", "swordfishai", "icypeas", "minerva",
  "datagma", "upcell", "zeliq",
])

function VendorTypeBadge({ id }: { id: string }) {
  const isContact = CONTACT_VENDOR_IDS.has(id)
  return isContact
    ? <span className="inline-flex items-center text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 ml-1">Contact</span>
    : <span className="inline-flex items-center text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 ml-1">Signal</span>
}

// ─── main component ────────────────────────────────────────────────────────────

export function CommercialHub() {
  const [subTab, setSubTab] = React.useState<"overview" | "legal">("overview")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = React.useState<"all" | "signal" | "contact">("all")
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
    .filter(v => {
      if (typeFilter === "all") return true
      const isContact = CONTACT_VENDOR_IDS.has(v.id)
      return typeFilter === "contact" ? isContact : !isContact
    })
    .map(v => {
      const base = vendorCommercialData[v.id] ?? null
      const comm = merged(v.id, base)
      const statusOverride = (overrides[v.id] as CommercialOverride)?.commercialStatus
      const section = (statusOverride !== undefined ? statusOverride : v.commercialStatus) ?? "tbd"
      return { vendor: v, commercial: comm, section: section as "ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd" }
    })
    .sort((a, b) => {
      const order = { signed: 0, committed: 1, review: 2, ready: 3, wait: 4, blocked: 5, tbd: 6 }
      return (order[a.section] ?? 6) - (order[b.section] ?? 6)
    })

  const readyCount   = rows.filter(r => r.section === "ready").length
  const waitCount    = rows.filter(r => r.section === "wait").length
  const reviewCount  = rows.filter(r => r.section === "review").length
  const paygCount    = rows.filter(r => r.commercial?.commitmentTier === "none").length
  const highCount    = rows.filter(r => r.commercial?.commitmentTier === "high").length

  const sections: Array<"ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd"> = ["signed", "committed", "review", "ready", "wait", "blocked", "tbd"]

  return (
    <div className="space-y-6">

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setSubTab("overview")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t transition-colors relative -mb-px ${
            subTab === "overview"
              ? "text-foreground font-medium border border-b-background bg-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Commercial Overview
        </button>
        <button
          onClick={() => setSubTab("legal")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t transition-colors relative -mb-px ${
            subTab === "legal"
              ? "text-foreground font-medium border border-b-background bg-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          ⚖️ Legal Review
        </button>
      </div>

      {/* Vendor type filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">Show:</span>
        {(["all", "signal", "contact"] as const).map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
              typeFilter === f
                ? f === "signal" ? "bg-violet-600 text-white border-violet-600"
                  : f === "contact" ? "bg-orange-500 text-white border-orange-500"
                  : "bg-foreground text-background border-foreground"
                : "text-muted-foreground border-muted hover:text-foreground hover:border-foreground"
            }`}
          >
            {f === "all" ? "All vendors" : f === "signal" ? "Signal / Company" : "Contact (phone + email)"}
          </button>
        ))}
      </div>

      {/* Legal Review tab */}
      {subTab === "legal" && <LegalReviewTab />}

      {/* Commercial Overview tab — only render when selected */}
      {subTab === "overview" && <>

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
          { label: "Negotiating",           value: reviewCount,  color: "text-blue-700",    icon: <TrendingUp className="h-4 w-4" />,   bg: "bg-blue-50"    },
          { label: "✅ PAYG / no commit",      value: paygCount,   color: "text-emerald-700", icon: <DollarSign className="h-4 w-4" />, bg: "bg-emerald-50" },
          { label: "❌ High commit ($50K+)",  value: highCount,   color: "text-red-700",     icon: <DollarSign className="h-4 w-4" />, bg: "bg-red-50"     },
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
          <p className="font-semibold text-yellow-700 mb-1">🟡 Medium commit ($10K–$50K)</p>
          <p className="text-muted-foreground">Harmonic ($10K), Dealroom (€12K/yr), Store Leads ($25K), Beauhurst (£20–40K), Crustdata ($4K/mo), HitHorizons (€3.5K/60K calls)</p>
        </div>
        <div>
          <p className="font-semibold text-red-700 mb-1">❌ High commit ($50K+)</p>
          <p className="text-muted-foreground">Crunchbase ($150K), PitchBook (~$160K), CB Insights (6-fig), Spade (6-fig), SimilarWeb ($50K+), Openmart ($80K), Explorium ($60K), BuyerCaddy ($50K+), Semrush (6-fig)</p>
        </div>
      </div>

      {/* Edit hint */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Pencil className="h-3 w-3" />
        Click any field to edit inline — changes sync automatically across browsers.
        Expand a row to edit pricing detail and move vendors between sections.
      </p>

      {/* Table */}
      <div className="rounded-lg border overflow-visible">
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
              <TableHead className="w-[130px]">Legal / Contract</TableHead>
              <TableHead className="w-[80px]">Contract</TableHead>
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

                    const rowBg = section === "ready"     ? "hover:bg-emerald-50/60"
                                : section === "wait"      ? "hover:bg-amber-50/60"
                                : section === "review"    ? "hover:bg-blue-50/60"
                                : section === "committed" ? "hover:bg-purple-50/60"
                                : section === "signed"    ? "hover:bg-teal-50/60"
                                : section === "blocked"   ? "hover:bg-red-50/40"
                                : "hover:bg-muted/30"

                    const leftAccent = section === "ready"     ? "border-l-2 border-l-emerald-400"
                                     : section === "wait"      ? "border-l-2 border-l-amber-400"
                                     : section === "review"    ? "border-l-2 border-l-blue-400"
                                     : section === "committed" ? "border-l-2 border-l-purple-400"
                                     : section === "signed"    ? "border-l-2 border-l-teal-400"
                                     : section === "blocked"   ? "border-l-2 border-l-red-300"
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm">{vendor.name}</span>
                              <VendorTypeBadge id={vendor.id} />
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
                              multiline
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
                              multiline
                            />
                          </TableCell>

                          {/* owner — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableOwnerField
                              value={commercial?.commercialOwner ?? null}
                              onSave={v => setField(vendor.id, "commercialOwner", v)}
                            />
                          </TableCell>

                          {/* legal status — editable */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            <EditableSelect<LegalStatus>
                              value={commercial?.legalStatus ?? null}
                              options={LEGAL_STATUSES as any}
                              onSave={v => setField(vendor.id, "legalStatus", v as LegalStatus | null)}
                            />
                          </TableCell>

                          {/* contract — link or editable URL */}
                          <TableCell onClick={e => e.stopPropagation()}>
                            {(() => {
                              const url = (overrides[vendor.id] as any)?.contractUrl ?? commercial?.contractUrl
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
                                  onSave={v => setField(vendor.id, "contractUrl" as any, v)}
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
                            <TableCell colSpan={9} className="p-0">
                              <div className={`px-6 py-4 border-t space-y-3 ${
                                section === "ready"     ? "bg-emerald-50/40" :
                                section === "wait"      ? "bg-amber-50/40" :
                                section === "review"    ? "bg-blue-50/40" :
                                section === "committed" ? "bg-purple-50/40" :
                                section === "signed"    ? "bg-teal-50/40" :
                                section === "blocked"   ? "bg-red-50/30" : "bg-muted/20"
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
                                      <EditableSelect<"ready" | "wait" | "review" | "committed" | "signed" | "blocked" | "tbd">
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
                                      <OwnerChip owner={commercial.commercialOwner ?? null} />
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
          <span className="bg-blue-100 text-blue-800 border border-blue-200 rounded-full px-1.5 py-0.5 text-[10px] font-medium">ADL</span>
        </span>
      </div>

      </> /* end overview tab */}
    </div>
  )
}
