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

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function fmtMonthly(annual: number) {
  const m = Math.round(annual / 12)
  return "$" + m.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

// Inline number editor
function EditableAmount({
  value,
  onSave,
}: {
  value: number | null
  onSave: (v: number | null) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value?.toString() ?? "")
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (editing) ref.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    const n = parseFloat(draft.replace(/[^0-9.]/g, ""))
    if (isNaN(n)) {
      onSave(null)
      setDraft("")
    } else {
      onSave(n)
      setDraft(n.toString())
    }
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(value?.toString() ?? "") } }}
        placeholder="e.g. 60000"
        className="w-full text-xs border border-violet-400 rounded px-1.5 py-0.5 bg-white outline-none ring-1 ring-violet-300 tabular-nums"
      />
    )
  }

  return (
    <span
      className="cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors text-sm tabular-nums font-medium"
      onClick={() => { setEditing(true); setDraft(value?.toString() ?? "") }}
    >
      {value != null ? fmt(value) : <span className="text-muted-foreground text-xs italic font-normal">click to set</span>}
    </span>
  )
}

// Status badge + selector
function StatusSelect({
  value,
  onSave,
}: {
  value: BudgetStatus
  onSave: (v: BudgetStatus) => void
}) {
  const opt = STATUS_OPTIONS.find(o => o.value === value) ?? STATUS_OPTIONS[0]
  return (
    <select
      value={value}
      onChange={e => onSave(e.target.value as BudgetStatus)}
      className={`text-xs rounded px-1.5 py-0.5 border-0 font-medium cursor-pointer outline-none focus:ring-1 focus:ring-violet-300 ${opt.color}`}
    >
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── main component ────────────────────────────────────────────────────────────

export function BudgetHub() {
  const { overrides, setField } = useLocalOverrides()

  // Merge base data with overrides
  const rows = vendorContacts
    .filter(v => vendorCommercialData[v.id])
    .map(v => {
      const base = vendorCommercialData[v.id]
      const ov = (overrides[v.id] ?? {}) as CommercialOverride
      return {
        vendor: v,
        annualBudgetUsd: (ov.annualBudgetUsd !== undefined ? ov.annualBudgetUsd : base.annualBudgetUsd) as number | null,
        budgetStatus: (ov.budgetStatus ?? base.budgetStatus) as BudgetStatus,
        commitmentLabel: ov.commitmentLabel ?? base.commitmentLabel,
        commitmentTier: ov.commitmentTier ?? base.commitmentTier,
      }
    })

  // Budget totals
  const included = rows.filter(r => r.budgetStatus !== "excluded")
  const signed    = rows.filter(r => r.budgetStatus === "signed")
  const tentative = rows.filter(r => r.budgetStatus === "tentative")
  const exploring = rows.filter(r => r.budgetStatus === "exploring")

  const totalFor = (rs: typeof rows) =>
    rs.reduce((sum, r) => sum + (r.annualBudgetUsd ?? 0), 0)

  const signedTotal    = totalFor(signed)
  const tentativeTotal = totalFor(tentative)
  const exploringTotal = totalFor(exploring)
  const baseTotal      = signedTotal + tentativeTotal   // base budget (firm commitments)
  const maxTotal       = baseTotal + exploringTotal     // max if everything exploring is signed

  // Notes inline editor (reusing same pattern as other fields)
  function BudgetNoteCell({ vendorId, note }: { vendorId: string; note: string }) {
    const [editing, setEditing] = React.useState(false)
    const [draft, setDraft] = React.useState(note)
    const ref = React.useRef<HTMLTextAreaElement>(null)
    React.useEffect(() => { if (editing) ref.current?.focus() }, [editing])
    function commit() { setEditing(false); setField(vendorId, "pricingTldr" as any, draft) }
    if (editing) return (
      <textarea
        ref={ref}
        value={draft}
        rows={2}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Escape") { setEditing(false); setDraft(note) } }}
        className="w-full text-xs border border-violet-400 rounded px-1.5 py-1 bg-white outline-none ring-1 ring-violet-300 resize-y"
      />
    )
    return (
      <span
        className="cursor-text hover:bg-violet-50 rounded px-0.5 -mx-0.5 transition-colors text-xs text-muted-foreground leading-snug"
        onClick={() => setEditing(true)}
      >
        {note || <span className="italic">—</span>}
      </span>
    )
  }

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-700">{fmt(signedTotal)}</div>
            <div className="text-xs text-muted-foreground">Signed / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-amber-50 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-amber-700">{fmt(tentativeTotal)}</div>
            <div className="text-xs text-muted-foreground">Tentative / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-blue-50 px-4 py-3 flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-blue-700 flex-shrink-0" />
          <div>
            <div className="text-2xl font-semibold tabular-nums text-blue-700">{fmt(exploringTotal)}</div>
            <div className="text-xs text-muted-foreground">Exploring / yr</div>
          </div>
        </div>
        <div className="rounded-lg border bg-violet-50 px-4 py-3 flex items-center gap-3">
          <DollarSign className="h-4 w-4 text-violet-700 flex-shrink-0" />
          <div>
            <div className="text-xl font-semibold tabular-nums text-violet-700">
              {fmt(baseTotal)}–{fmt(maxTotal)}
            </div>
            <div className="text-xs text-muted-foreground">Total range / yr</div>
          </div>
        </div>
      </div>

      {/* Finance summary callout */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900 space-y-1">
        <p className="font-semibold">Finance summary</p>
        <p className="text-xs text-violet-800">
          <strong>Base budget (signed + tentative):</strong> {fmt(baseTotal)}/yr · {fmtMonthly(baseTotal)}/mo
          {" · "}
          <strong>Monthly:</strong> {fmtMonthly(signedTotal + tentativeTotal)}
        </p>
        <p className="text-xs text-violet-800">
          <strong>Max exposure (+ exploring):</strong> {fmt(maxTotal)}/yr · {fmtMonthly(maxTotal)}/mo
        </p>
        <p className="text-xs text-violet-700 mt-1">
          {signed.length} signed · {tentative.length} tentative · {exploring.length} exploring · {rows.length - included.length} excluded (PAYG/deprioritized)
        </p>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Click any amount to edit. Set status to <strong>Excluded</strong> to remove from totals (e.g. PAYG vendors). Changes sync automatically.
      </p>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[160px]">Vendor</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-[100px]">Status</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[130px]">Annual (USD)</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground w-[100px]">Monthly</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Commitment label</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Pricing summary</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows
              .sort((a, b) => {
                // Sort: signed → tentative → exploring → excluded, then by amount desc
                const order: Record<BudgetStatus, number> = { signed: 0, tentative: 1, exploring: 2, excluded: 3 }
                const statusDiff = order[a.budgetStatus] - order[b.budgetStatus]
                if (statusDiff !== 0) return statusDiff
                return (b.annualBudgetUsd ?? 0) - (a.annualBudgetUsd ?? 0)
              })
              .map(({ vendor, annualBudgetUsd, budgetStatus, commitmentLabel }) => {
                const base = vendorCommercialData[vendor.id]
                const ov = (overrides[vendor.id] ?? {}) as CommercialOverride
                const tldr = ov.pricingTldr ?? base.pricingTldr
                const excluded = budgetStatus === "excluded"

                return (
                  <tr key={vendor.id} className={excluded ? "opacity-40 hover:opacity-70" : "hover:bg-muted/20"}>
                    <td className="px-3 py-2 font-medium">{vendor.name}</td>
                    <td className="px-3 py-2">
                      <StatusSelect
                        value={budgetStatus}
                        onSave={v => setField(vendor.id, "budgetStatus", v)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableAmount
                        value={annualBudgetUsd}
                        onSave={v => setField(vendor.id, "annualBudgetUsd", v)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {annualBudgetUsd != null ? fmtMonthly(annualBudgetUsd) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{commitmentLabel}</td>
                    <td className="px-3 py-2 max-w-[320px]">
                      <BudgetNoteCell vendorId={vendor.id} note={tldr} />
                    </td>
                  </tr>
                )
              })}
          </tbody>
          {/* Totals footer */}
          <tfoot>
            <tr className="bg-muted/30 border-t-2 font-semibold">
              <td className="px-3 py-2 text-xs" colSpan={2}>Total (excl. excluded)</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(baseTotal + exploringTotal)}</td>
              <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">{fmtMonthly(baseTotal + exploringTotal)}</td>
              <td colSpan={2} />
            </tr>
            <tr className="bg-emerald-50/60 border-t font-medium text-emerald-800">
              <td className="px-3 py-2 text-xs" colSpan={2}>Base (signed + tentative)</td>
              <td className="px-3 py-2 text-right tabular-nums text-sm">{fmt(baseTotal)}</td>
              <td className="px-3 py-2 text-right text-xs tabular-nums">{fmtMonthly(baseTotal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  )
}
