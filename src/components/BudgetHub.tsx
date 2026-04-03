import * as React from "react"
import { vendorContacts } from "@/vendorHubData"
import { vendorCommercialData, type BudgetStatus } from "@/vendorCommercialData"
import { useLocalOverrides, type CommercialOverride } from "@/hooks/useLocalOverrides"
import { DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react"

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: BudgetStatus; label: string; color: string }> = [
  { value: "excluded",  label: "Excluded",  color: "text-muted-foreground bg-muted/40" },
  { value: "exploring", label: "Exploring", color: "text-blue-700 bg-blue-50" },
  { value: "tentative", label: "Tentative", color: "text-amber-700 bg-amber-50" },
  { value: "signed",    label: "Signed",    color: "text-emerald-700 bg-emerald-50" },
]

function fmtUsd(n: number) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function fmtVolume(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (n >= 1_000) return Math.round(n / 1000) + "K"
  return n.toLocaleString()
}

function fmtMonthly(annual: number) {
  return "$" + Math.round(annual / 12).toLocaleString("en-US")
}

// Inline number editor
function EditableAmount({ value, onSave, displayFn = fmtUsd }: {
  value: number | null
  onSave: (v: number | null) => void
  displayFn?: (n: number) => string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value?.toString() ?? "")
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (editing) ref.current?.select() }, [editing])
  function commit() {
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
    <span className="cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors tabular-nums font-medium"
      onClick={() => { setEditing(true); setDraft(value?.toString() ?? "") }}>
      {value != null ? displayFn(value) : <span className="text-muted-foreground text-xs italic font-normal">—</span>}
    </span>
  )
}

// Inline text editor
function EditableText({ value, onSave, className = "" }: {
  value: string; onSave: (v: string) => void; className?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  function commit() { setEditing(false); onSave(draft) }
  if (editing) return (
    <textarea ref={ref} value={draft} rows={2}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Escape") { setEditing(false); setDraft(value) } }}
      className={`w-full text-xs border border-violet-400 rounded px-1.5 py-1 bg-white outline-none ring-1 ring-violet-300 resize-y ${className}`}
    />
  )
  return (
    <span className={`cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors leading-snug ${className}`}
      onClick={() => setEditing(true)}>
      {value || <span className="italic text-muted-foreground">—</span>}
    </span>
  )
}

// Status dropdown
function StatusSelect({ value, onSave }: { value: BudgetStatus; onSave: (v: BudgetStatus) => void }) {
  const opt = STATUS_OPTIONS.find(o => o.value === value) ?? STATUS_OPTIONS[0]
  return (
    <select value={value} onChange={e => onSave(e.target.value as BudgetStatus)}
      className={`text-xs rounded px-1.5 py-0.5 border-0 font-medium cursor-pointer outline-none focus:ring-1 focus:ring-violet-300 ${opt.color}`}>
      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

export function BudgetHub() {
  const { overrides, setField } = useLocalOverrides()

  const rows = vendorContacts
    .filter(v => vendorCommercialData[v.id])
    .map(v => {
      const base = vendorCommercialData[v.id]
      const ov = (overrides[v.id] ?? {}) as CommercialOverride
      return {
        vendor: v,
        annualBudgetUsd:       (ov.annualBudgetUsd       !== undefined ? ov.annualBudgetUsd       : base.annualBudgetUsd)       as number | null,
        budgetStatus:          (ov.budgetStatus           ?? base.budgetStatus)                                                  as BudgetStatus,
        estimatedAnnualVolume: (ov.estimatedAnnualVolume  !== undefined ? ov.estimatedAnnualVolume  : base.estimatedAnnualVolume) as number | null,
        coverageNote:          (ov.coverageNote           ?? base.coverageNote)                                                  as string,
        financeNote:           (ov.financeNote            ?? base.financeNote)                                                   as string,
      }
    })

  const signed    = rows.filter(r => r.budgetStatus === "signed")
  const tentative = rows.filter(r => r.budgetStatus === "tentative")
  const exploring = rows.filter(r => r.budgetStatus === "exploring")
  const included  = rows.filter(r => r.budgetStatus !== "excluded")

  const totalFor = (rs: typeof rows) => rs.reduce((s, r) => s + (r.annualBudgetUsd ?? 0), 0)
  const signedTotal    = totalFor(signed)
  const tentativeTotal = totalFor(tentative)
  const exploringTotal = totalFor(exploring)
  const baseTotal      = signedTotal + tentativeTotal
  const maxTotal       = baseTotal + exploringTotal

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-700">{fmtUsd(signedTotal)}</div>
            <div className="text-xs text-muted-foreground">Signed / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-amber-50 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-amber-700">{fmtUsd(tentativeTotal)}</div>
            <div className="text-xs text-muted-foreground">Tentative / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-blue-50 px-4 py-3 flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-blue-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-blue-700">{fmtUsd(exploringTotal)}</div>
            <div className="text-xs text-muted-foreground">Exploring / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-violet-50 px-4 py-3 flex items-center gap-3">
          <DollarSign className="h-4 w-4 text-violet-700 flex-shrink-0" />
          <div>
            <div className="text-lg font-semibold tabular-nums text-violet-700">
              {fmtUsd(baseTotal)}–{fmtUsd(maxTotal)}
            </div>
            <div className="text-xs text-muted-foreground">Total range / yr</div>
          </div>
        </div>
      </div>

      {/* Finance callout */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 space-y-1">
        <p className="text-sm font-semibold text-violet-900">Finance summary</p>
        <p className="text-xs text-violet-800">
          <strong>Base (signed + tentative):</strong> {fmtUsd(baseTotal)}/yr · {fmtMonthly(baseTotal)}/mo
        </p>
        <p className="text-xs text-violet-800">
          <strong>Max exposure (+ exploring):</strong> {fmtUsd(maxTotal)}/yr · {fmtMonthly(maxTotal)}/mo
        </p>
        <p className="text-xs text-violet-700">
          {signed.length} signed · {tentative.length} tentative · {exploring.length} exploring · {rows.length - included.length} excluded (PAYG / not budgeted)
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Click any cell to edit inline. <strong>Excluded</strong> vendors are grayed out and not counted in totals. Changes sync automatically.
      </p>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[130px]">Vendor</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[100px]">Status</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[110px]">Annual (USD)</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[75px]">Monthly</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[105px]">Est. volume/yr</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[80px]">$/unit</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[190px]">What it covers</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Finance note</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows
              .sort((a, b) => {
                const order: Record<BudgetStatus, number> = { signed: 0, tentative: 1, exploring: 2, excluded: 3 }
                const d = order[a.budgetStatus] - order[b.budgetStatus]
                return d !== 0 ? d : (b.annualBudgetUsd ?? 0) - (a.annualBudgetUsd ?? 0)
              })
              .map(({ vendor, annualBudgetUsd, budgetStatus, estimatedAnnualVolume, coverageNote, financeNote }) => {
                const excluded = budgetStatus === "excluded"
                const costPerUnit = annualBudgetUsd != null && estimatedAnnualVolume != null && estimatedAnnualVolume > 0
                  ? annualBudgetUsd / estimatedAnnualVolume
                  : null

                return (
                  <tr key={vendor.id} className={excluded ? "opacity-40 hover:opacity-60 transition-opacity" : "hover:bg-muted/20"}>
                    <td className="px-3 py-2 font-medium">{vendor.name}</td>
                    <td className="px-3 py-2">
                      <StatusSelect value={budgetStatus} onSave={v => setField(vendor.id, "budgetStatus", v)} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableAmount value={annualBudgetUsd} onSave={v => setField(vendor.id, "annualBudgetUsd", v)} />
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {annualBudgetUsd != null ? fmtMonthly(annualBudgetUsd) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableAmount
                        value={estimatedAnnualVolume}
                        onSave={v => setField(vendor.id, "estimatedAnnualVolume", v)}
                        displayFn={fmtVolume}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {costPerUnit != null
                        ? costPerUnit < 0.01 ? `$${costPerUnit.toFixed(4)}`
                        : costPerUnit < 1    ? `$${costPerUnit.toFixed(3)}`
                        :                      `$${costPerUnit.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <EditableText value={coverageNote} onSave={v => setField(vendor.id, "coverageNote", v)}
                        className="text-xs text-muted-foreground" />
                    </td>
                    <td className="px-3 py-2">
                      <EditableText value={financeNote} onSave={v => setField(vendor.id, "financeNote", v)}
                        className="text-xs text-muted-foreground" />
                    </td>
                  </tr>
                )
              })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t-2 font-semibold">
              <td className="px-3 py-2 text-xs" colSpan={2}>Total (excl. excluded)</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(baseTotal + exploringTotal)}</td>
              <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">{fmtMonthly(baseTotal + exploringTotal)}</td>
              <td colSpan={4} />
            </tr>
            <tr className="bg-emerald-50/60 border-t font-medium text-emerald-800">
              <td className="px-3 py-2 text-xs" colSpan={2}>Base (signed + tentative)</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(baseTotal)}</td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtMonthly(baseTotal)}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  )
}
