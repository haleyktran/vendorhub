import * as React from "react"
import { contactVendors, type ContactVendor, type ContactVendorType, type ContactVendorStatus, type QuestionnaireStatus } from "@/contactVendorData"
import { Key, Phone, Mail, Users, CheckCircle2, Clock, AlertCircle, ExternalLink, Pencil, ChevronDown } from "lucide-react"

// ─── Overrides hook (localStorage + Redis sync) ────────────────────────────────

const STORAGE_KEY = "contact-vendor-overrides-v1"
const API_URL = "/api/contact-overrides"
const POLL_MS = 8000

type ContactVendorOverride = Partial<Omit<ContactVendor, "id" | "name" | "type">>

function loadLocal(): Record<string, ContactVendorOverride> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") } catch { return {} }
}
function saveLocal(o: Record<string, ContactVendorOverride>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o))
}
async function fetchRemote(): Promise<Record<string, ContactVendorOverride>> {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error("fetch failed")
  return res.json()
}
async function pushRemote(o: Record<string, ContactVendorOverride>) {
  await fetch(API_URL, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) })
}

function useContactOverrides() {
  const [overrides, setOverrides] = React.useState<Record<string, ContactVendorOverride>>(loadLocal)

  const apply = React.useCallback((next: Record<string, ContactVendorOverride>) => {
    saveLocal(next)
    setOverrides(next)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let initialised = false
    const poll = async () => {
      try {
        const remote = await fetchRemote()
        if (cancelled) return
        if (!initialised) {
          initialised = true
          const local = loadLocal()
          if (Object.keys(local).length > 0 && Object.keys(remote).length === 0) {
            await pushRemote(local)
          } else {
            apply(remote)
          }
        } else {
          apply(remote)
        }
      } catch { /* keep local state */ }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [apply])

  const setField = React.useCallback(
    <K extends keyof ContactVendorOverride>(id: string, field: K, value: ContactVendorOverride[K]) => {
      setOverrides(prev => {
        const next = { ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } }
        saveLocal(next)
        pushRemote(next)
        return next
      })
    }, []
  )

  return { overrides, setField }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ContactVendorStatus, { label: string; pill: string; dot: string }> = {
  "not-started":    { label: "Not started",    pill: "bg-gray-100 text-gray-600 border-gray-200",       dot: "bg-gray-300" },
  "contacted":      { label: "Contacted",       pill: "bg-blue-100 text-blue-700 border-blue-200",       dot: "bg-blue-400" },
  "meeting-booked": { label: "Meeting booked",  pill: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  "trial-active":   { label: "Trial active",    pill: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  "evaluating":     { label: "Evaluating",      pill: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-400" },
  "shortlisted":    { label: "Shortlisted ⭐",   pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  "pass":             { label: "Pass",              pill: "bg-red-50 text-red-500 border-red-200",              dot: "bg-red-300" },
  "already-evaluated": { label: "Already evaluated", pill: "bg-stone-100 text-stone-500 border-stone-200",       dot: "bg-stone-400" },
}

const STATUS_OPTIONS: Array<{ value: ContactVendorStatus; label: string }> = [
  { value: "not-started",    label: "Not started" },
  { value: "contacted",      label: "Contacted" },
  { value: "meeting-booked", label: "Meeting booked" },
  { value: "trial-active",   label: "Trial active" },
  { value: "evaluating",     label: "Evaluating" },
  { value: "shortlisted",    label: "Shortlisted ⭐" },
  { value: "pass",             label: "Pass" },
  { value: "already-evaluated", label: "Already evaluated" },
]

const Q_STATUS_CONFIG: Record<QuestionnaireStatus, { label: string; color: string }> = {
  "not-sent":    { label: "Not sent",    color: "text-gray-400" },
  "sent":        { label: "Sent",        color: "text-amber-600" },
  "in-progress": { label: "In progress", color: "text-blue-600" },
  "complete":    { label: "Complete ✓",  color: "text-emerald-600" },
}

const Q_STATUS_OPTIONS: Array<{ value: QuestionnaireStatus; label: string }> = [
  { value: "not-sent",    label: "Not sent" },
  { value: "sent",        label: "Sent" },
  { value: "in-progress", label: "In progress" },
  { value: "complete",    label: "Complete ✓" },
]

const TYPE_ICON = {
  phone: <Phone className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  both:  <Users className="h-3 w-3" />,
}

const TYPE_LABEL = {
  phone: "Phone",
  email: "Email",
  both:  "Both",
}

// ─── Inline edit primitives ────────────────────────────────────────────────────

function EditableText({
  value, onSave, placeholder = "—", className = "", multiline = false,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const ref = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  React.useEffect(() => { setDraft(value) }, [value])
  React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  const commit = () => { setEditing(false); if (draft.trim() !== value) onSave(draft.trim()) }
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
      ? <textarea {...shared} rows={2} className={shared.className + " resize-y"} />
      : <input {...shared} />
  }
  return (
    <span
      className={`group/edit relative inline-flex items-start gap-1 cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors ${className}`}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      <span className="flex-1">{value || <span className="italic text-muted-foreground text-xs">{placeholder}</span>}</span>
      <Pencil className="h-2.5 w-2.5 text-violet-400 opacity-0 group-hover/edit:opacity-100 mt-0.5 flex-shrink-0" />
    </span>
  )
}

function EditableNumber({
  value, onSave, placeholder = "—", formatFn,
}: {
  value: number | null
  onSave: (v: number | null) => void
  placeholder?: string
  formatFn?: (n: number) => string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value?.toString() ?? "")
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (editing) ref.current?.select() }, [editing])
  const commit = () => {
    setEditing(false)
    const n = parseFloat(draft.replace(/[^0-9.]/g, ""))
    onSave(isNaN(n) ? null : n)
    setDraft(isNaN(n) ? "" : n.toString())
  }
  if (editing) return (
    <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(value?.toString() ?? "") } }}
      placeholder="number"
      className="w-full text-xs border border-violet-400 rounded px-1.5 py-0.5 bg-white outline-none ring-1 ring-violet-300 tabular-nums"
    />
  )
  return (
    <span className="cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors tabular-nums font-medium text-xs"
      onClick={() => { setEditing(true); setDraft(value?.toString() ?? "") }}>
      {value != null
        ? (formatFn ? formatFn(value) : value.toLocaleString())
        : <span className="text-muted-foreground italic font-normal">{placeholder}</span>}
    </span>
  )
}

function StatusPill({
  value, onSave,
}: {
  value: ContactVendorStatus
  onSave: (v: ContactVendorStatus) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])
  const cfg = STATUS_CONFIG[value]
  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className={`inline-flex items-center gap-0.5 text-[10px] font-medium border rounded-full px-2 py-0.5 cursor-pointer ${cfg.pill}`}
      >
        {cfg.label}
        <ChevronDown className={`h-2.5 w-2.5 opacity-60 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
          {STATUS_OPTIONS.map(o => (
            <button key={o.value}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onSave(o.value); setOpen(false) }}
              className={`w-full text-left text-[11px] px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${o.value === value ? "font-semibold bg-muted/30" : ""}`}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function QStatusSelect({
  value, onSave,
}: {
  value: QuestionnaireStatus
  onSave: (v: QuestionnaireStatus) => void
}) {
  return (
    <select value={value} onChange={e => onSave(e.target.value as QuestionnaireStatus)}
      className={`text-xs rounded px-1.5 py-0.5 border-0 cursor-pointer outline-none focus:ring-1 focus:ring-violet-300 bg-transparent ${Q_STATUS_CONFIG[value].color}`}
    >
      {Q_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function BoolToggle({
  value, onSave, trueLabel, falseLabel,
}: {
  value: boolean
  onSave: (v: boolean) => void
  trueLabel: string
  falseLabel: string
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onSave(!value) }}
      className={`text-[10px] font-medium rounded-full px-2 py-0.5 border cursor-pointer transition-colors ${
        value
          ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type FilterType = "all" | ContactVendorType

export function ContactVendorHub() {
  const { overrides, setField } = useContactOverrides()
  const [typeFilter, setTypeFilter] = React.useState<FilterType>("all")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggle = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const rows = contactVendors.map(v => {
    const o = overrides[v.id] ?? {}
    return {
      ...v,
      ...o,
      // ensure type always comes from base data (not overrideable)
      type: v.type,
      name: v.name,
      id: v.id,
    } as ContactVendor
  })

  const filtered = typeFilter === "all" ? rows : rows.filter(r => r.type === typeFilter || r.type === "both")

  // Summary stats
  const meetingCount      = rows.filter(r => r.meetingBooked).length
  const apiKeyCount       = rows.filter(r => r.hasApiKey).length
  const questCompleteCount = rows.filter(r => r.questionnaireStatus === "complete").length
  const shortlistedCount  = rows.filter(r => r.status === "shortlisted").length

  const notStarted = rows.filter(r => r.status === "not-started").length

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total vendors",       value: rows.length,         color: "text-gray-700",    bg: "bg-gray-50",    icon: <Users className="h-4 w-4" /> },
          { label: "Meetings booked",     value: meetingCount,        color: "text-amber-700",   bg: "bg-amber-50",   icon: <Clock className="h-4 w-4" /> },
          { label: "API keys gotten",     value: apiKeyCount,         color: "text-violet-700",  bg: "bg-violet-50",  icon: <Key className="h-4 w-4" /> },
          { label: "Questionnaires done", value: questCompleteCount,  color: "text-blue-700",    bg: "bg-blue-50",    icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Shortlisted",         value: shortlistedCount,    color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="h-4 w-4" /> },
        ].map(s => (
          <div key={s.label} className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${s.bg}`}>
            <span className={s.color}>{s.icon}</span>
            <div>
              <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Callout if many not started */}
      {notStarted > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {notStarted} vendor{notStarted !== 1 ? "s" : ""} not yet contacted
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              For each vendor: (1) book a meeting, (2) request API key + trial credits, (3) send questionnaire link, (4) get pricing details and rate limits.
              Reference spreadsheet:{" "}
              <a href="https://docs.google.com/spreadsheets/d/192EVDuNIb_Qg8nxT-_fc3fg3FelMaXIEoA58pg5anzE"
                target="_blank" rel="noopener noreferrer"
                className="underline hover:text-amber-900"
              >Google Sheet</a>
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs + edit hint */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "phone", "email", "both"] as const).map(f => (
            <button key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                typeFilter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? `All (${rows.length})` : f === "both" ? `Both (${rows.filter(r => r.type === "both").length})` : `${f.charAt(0).toUpperCase() + f.slice(1)}-only (${rows.filter(r => r.type === f).length})`}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Pencil className="h-3 w-3" />
          Click any cell to edit. Click status pill to update stage.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[1500px]">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-6"></th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[180px]">Vendor</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[130px]">Type</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[150px]">Status</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[180px]">Meeting</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[150px]">Questionnaire</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground w-[110px]">API Key</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[120px]">Trial credits</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[200px]">Pricing</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[120px]">Rate limit</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[120px]">Slack</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Coverage / notes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(vendor => {
              const expanded = expandedRows.has(vendor.id)
              const o = overrides[vendor.id] ?? {}
              const status         = (o.status         ?? vendor.status)         as ContactVendorStatus
              const meetingBooked  = (o.meetingBooked  ?? vendor.meetingBooked)  as boolean
              const qStatus        = (o.questionnaireStatus ?? vendor.questionnaireStatus) as QuestionnaireStatus
              const qUrl           = o.questionnaireUrl ?? vendor.questionnaireUrl
              const hasApiKey      = (o.hasApiKey      ?? vendor.hasApiKey)      as boolean
              const trialCredits   = (o.trialCredits   !== undefined ? o.trialCredits   : vendor.trialCredits)   as number | null
              const credEquiv      = o.trialCreditsEquiv ?? vendor.trialCreditsEquiv ?? ""
              const pricing        = o.pricingNotes    ?? vendor.pricingNotes    ?? ""
              const rateLimit      = o.rateLimit       ?? vendor.rateLimit       ?? ""
              const slack          = o.slackChannel    ?? vendor.slackChannel    ?? ""
              const notes          = o.notes           ?? vendor.notes           ?? ""
              const meetingDate    = o.meetingDate     ?? vendor.meetingDate     ?? ""

              const dim = status === "pass" ? "opacity-50" : ""

              return (
                <React.Fragment key={vendor.id}>
                  <tr
                    className={`hover:bg-muted/20 transition-colors cursor-pointer ${dim}`}
                    onClick={() => toggle(vendor.id)}
                  >
                    {/* expand chevron */}
                    <td className="px-2 py-2 text-muted-foreground">
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`} />
                    </td>

                    {/* vendor name */}
                    <td className="px-3 py-2">
                      <div className="font-semibold text-sm">{vendor.name}</div>
                      {vendor.website && (
                        <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-violet-600 flex items-center gap-0.5"
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink className="h-2.5 w-2.5" />{vendor.website}
                        </a>
                      )}
                    </td>

                    {/* type */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border ${
                        vendor.type === "phone" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        vendor.type === "email" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-purple-50 text-purple-700 border-purple-200"
                      }`}>
                        {TYPE_ICON[vendor.type]}
                        {TYPE_LABEL[vendor.type]}
                      </span>
                    </td>

                    {/* status */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <StatusPill value={status} onSave={v => setField(vendor.id, "status", v)} />
                    </td>

                    {/* meeting booked */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
                        <BoolToggle value={meetingBooked} onSave={v => setField(vendor.id, "meetingBooked", v)}
                          trueLabel="✓ Booked" falseLabel="No meeting" />
                        {meetingBooked && (
                          <EditableText value={meetingDate} onSave={v => setField(vendor.id, "meetingDate", v)}
                            placeholder="Add date…" className="text-xs text-muted-foreground leading-snug" />
                        )}
                      </div>
                    </td>

                    {/* questionnaire */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="space-y-1">
                        <QStatusSelect value={qStatus} onSave={v => setField(vendor.id, "questionnaireStatus", v)} />
                        {qUrl ? (
                          <a href={qUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] text-violet-600 hover:underline"
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink className="h-2.5 w-2.5" /> Open doc
                          </a>
                        ) : (
                          <EditableText value="" onSave={v => setField(vendor.id, "questionnaireUrl", v)}
                            placeholder="Paste URL…" className="text-[10px] text-muted-foreground" />
                        )}
                      </div>
                    </td>

                    {/* api key */}
                    <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <BoolToggle value={hasApiKey} onSave={v => setField(vendor.id, "hasApiKey", v)}
                        trueLabel="✓ Got key" falseLabel="No key" />
                    </td>

                    {/* trial credits */}
                    <td className="px-3 py-2 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-col items-end gap-0.5">
                        <EditableNumber value={trialCredits} onSave={v => setField(vendor.id, "trialCredits", v)}
                          placeholder="—" formatFn={n => n.toLocaleString()} />
                        {(credEquiv || trialCredits != null) && (
                          <EditableText value={credEquiv} onSave={v => setField(vendor.id, "trialCreditsEquiv", v)}
                            placeholder="e.g. ~500 lookups" className="text-[10px] text-muted-foreground" />
                        )}
                      </div>
                    </td>

                    {/* pricing */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <EditableText value={pricing} onSave={v => setField(vendor.id, "pricingNotes", v)}
                        placeholder="Add pricing…" className="text-xs" multiline />
                    </td>

                    {/* rate limit */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <EditableText value={rateLimit} onSave={v => setField(vendor.id, "rateLimit", v)}
                        placeholder="e.g. 100/min" className="text-xs text-muted-foreground" />
                    </td>

                    {/* slack */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      {slack ? (
                        slack.startsWith("http") ? (
                          <a href={slack} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[11px] text-violet-600 hover:underline font-medium"
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink className="h-3 w-3" />Open
                          </a>
                        ) : (
                          <span
                            className="text-[11px] text-muted-foreground cursor-text hover:bg-violet-50 rounded px-0.5 transition-colors"
                            onClick={e => { e.stopPropagation(); setField(vendor.id, "slackChannel", "") }}
                            title="Click to edit"
                          >{slack}</span>
                        )
                      ) : (
                        <EditableText value="" onSave={v => setField(vendor.id, "slackChannel", v)}
                          placeholder="#channel or URL" className="text-[11px] text-muted-foreground" />
                      )}
                    </td>

                    {/* coverage / notes */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <EditableText value={notes} onSave={v => setField(vendor.id, "notes", v)}
                        placeholder="Coverage notes…" className="text-xs text-muted-foreground" multiline />
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded && (
                    <tr className="hover:bg-transparent">
                      <td colSpan={12} className="p-0">
                        <div className="px-6 py-4 border-t bg-muted/10 space-y-3">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Notes</p>
                              <EditableText
                                value={notes}
                                onSave={v => setField(vendor.id, "notes", v)}
                                className="text-sm text-foreground leading-relaxed block w-full"
                                multiline
                                placeholder="Add evaluation notes…"
                              />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Meeting date</p>
                                <EditableText
                                  value={meetingDate}
                                  onSave={v => setField(vendor.id, "meetingDate", v)}
                                  className="text-sm"
                                  placeholder="e.g. 2026-04-22 10am PDT"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Slack channel</p>
                                <EditableText
                                  value={slack}
                                  onSave={v => setField(vendor.id, "slackChannel", v)}
                                  className="text-sm"
                                  placeholder="#channel-name or Slack URL"
                                />
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Questionnaire URL</p>
                                <EditableText
                                  value={qUrl ?? ""}
                                  onSave={v => setField(vendor.id, "questionnaireUrl", v)}
                                  className="text-sm"
                                  placeholder="Paste Google Doc URL…"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-orange-400" /> Phone vendor</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-400" /> Email vendor</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-purple-400" /> Phone + Email</span>
        <span className="ml-auto">Click any cell to edit · Changes saved locally</span>
      </div>
    </div>
  )
}
