import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  linkedinVendors,
  type LinkedInVendor,
  type LiActionItem,
  type LiStatus,
  type LiWhiteLabel,
  type LiEmailStatus,
} from "@/linkedinVendorData"
import {
  Search,
  Mail,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Hourglass,
  ExternalLink,
  User,
  HelpCircle,
} from "lucide-react"

// ─── persistence (localStorage + Redis sync, mirrors VendorHub) ───────────────

const STORAGE_KEY = "linkedin-hub-followups-v1"
const API_URL = "/api/linkedin-overrides"
const POLL_MS = 8000

type FollowupState = {
  actionState: Record<string, boolean>
  ownerState: Record<string, string>
}

function loadLocal(): FollowupState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") } catch { return { actionState: {}, ownerState: {} } }
}
function saveLocal(s: FollowupState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}
async function fetchRemote(): Promise<FollowupState> {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error("fetch failed")
  return res.json()
}
async function pushRemote(s: FollowupState) {
  await fetch(API_URL, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
}

function useFollowupState() {
  const [state, setState] = React.useState<FollowupState>(() => {
    const l = loadLocal()
    return { actionState: l.actionState ?? {}, ownerState: l.ownerState ?? {} }
  })

  const apply = React.useCallback((next: FollowupState) => {
    const safe = { actionState: next.actionState ?? {}, ownerState: next.ownerState ?? {} }
    saveLocal(safe)
    setState(safe)
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
          const localHasData = Object.keys(local.actionState ?? {}).length + Object.keys(local.ownerState ?? {}).length > 0
          const remoteEmpty = Object.keys(remote.actionState ?? {}).length + Object.keys(remote.ownerState ?? {}).length === 0
          if (localHasData && remoteEmpty) {
            await pushRemote(local)
          } else {
            apply(remote)
          }
        } else {
          apply(remote)
        }
      } catch { /* keep local */ }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [apply])

  const setAction = React.useCallback((key: string, value: boolean) => {
    setState(prev => {
      const next = { ...prev, actionState: { ...prev.actionState, [key]: value } }
      saveLocal(next)
      pushRemote(next)
      return next
    })
  }, [])

  const setOwner = React.useCallback((key: string, value: string) => {
    setState(prev => {
      const next = { ...prev, ownerState: { ...prev.ownerState, [key]: value } }
      saveLocal(next)
      pushRemote(next)
      return next
    })
  }, [])

  return { actionState: state.actionState, ownerState: state.ownerState, setAction, setOwner }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function lastContactLabel(dateStr: string | null): { text: string; color: string } {
  const days = daysSince(dateStr)
  if (days === null) return { text: "Never", color: "text-gray-400" }
  if (days === 0) return { text: "Today", color: "text-emerald-700" }
  if (days === 1) return { text: "Yesterday", color: "text-emerald-600" }
  if (days <= 3) return { text: `${days}d ago`, color: "text-emerald-600" }
  if (days <= 7) return { text: `${days}d ago`, color: "text-amber-600" }
  if (days <= 14) return { text: `${days}d ago`, color: "text-orange-600" }
  return { text: `${days}d ago`, color: "text-red-600" }
}

function statusBadge(status: LiStatus) {
  const map: Record<LiStatus, { label: string; variant: "green" | "yellow" | "red" | "gray" | "purple" }> = {
    active:          { label: "Active",         variant: "green" },
    trial:           { label: "Trial",          variant: "purple" },
    "meeting-booked":{ label: "Meeting",        variant: "yellow" },
    stalled:         { label: "Stalled",        variant: "red" },
    deprioritized:   { label: "Deprioritized",  variant: "gray" },
    pending:         { label: "Pending",        variant: "gray" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

function whiteLabelBadge(wl: LiWhiteLabel) {
  const map: Record<LiWhiteLabel, { label: string; variant: "green" | "yellow" | "red" | "gray" | "purple" }> = {
    yes:     { label: "White-label", variant: "green" },
    partial: { label: "Partial",     variant: "yellow" },
    open:    { label: "Open to it",  variant: "purple" },
    no:      { label: "N/A",         variant: "gray" },
    unknown: { label: "TBD",         variant: "gray" },
  }
  const { label, variant } = map[wl]
  return <Badge variant={variant}>{label}</Badge>
}

function emailBadge(status: LiEmailStatus, subject?: string) {
  if (status === "needs-response")
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="red" className="flex items-center gap-1 w-fit">
          <Mail className="h-3 w-3" />
          Needs reply
        </Badge>
        {subject && <span className="text-xs text-muted-foreground truncate max-w-[220px]">{subject}</span>}
      </div>
    )
  if (status === "waiting-on-them")
    return (
      <Badge variant="yellow" className="flex items-center gap-1 w-fit">
        <Hourglass className="h-3 w-3" />
        Waiting on them
      </Badge>
    )
  return <span className="text-xs text-muted-foreground">—</span>
}

const OWNER_STYLES: Record<string, string> = {
  me:    "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200",
  kevin: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  james: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  them:  "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
}
const OWNER_LABELS: Record<string, string> = { me: "Haley", kevin: "Kevin", james: "James", them: "Vendor" }

function OwnerSelect({ owner, onChange }: { owner: string; onChange: (o: string) => void }) {
  return (
    <select
      value={owner}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      onClick={(e) => e.stopPropagation()}
      className={`text-[10px] font-medium rounded-full border px-1.5 py-0 h-4 cursor-pointer appearance-none outline-none transition-colors ${OWNER_STYLES[owner] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
      title="Change owner"
    >
      <option value="me">Haley</option>
      <option value="kevin">Kevin</option>
      <option value="james">James</option>
      <option value="them">Vendor</option>
    </select>
  )
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function matchesSearch(v: LinkedInVendor, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    v.name.toLowerCase().includes(q) ||
    v.summary.toLowerCase().includes(q) ||
    v.integrationModel.toLowerCase().includes(q) ||
    v.pricing.toLowerCase().includes(q) ||
    v.whiteLabelNote.toLowerCase().includes(q) ||
    v.banHistory.toLowerCase().includes(q) ||
    v.notes.some((n) => n.toLowerCase().includes(q)) ||
    v.actionItems.some((a) => a.text.toLowerCase().includes(q)) ||
    v.openQuestions.some((o) => o.toLowerCase().includes(q)) ||
    v.contacts.some((c) => c.toLowerCase().includes(q))
  )
}

// ─── action item row ──────────────────────────────────────────────────────────

function ActionItemRow({
  item, onToggle, onOwnerChange, query,
}: {
  item: LiActionItem
  onToggle: (id: string) => void
  onOwnerChange: (id: string, owner: string) => void
  query: string
}) {
  return (
    <div className={`flex items-start gap-2 py-1 ${item.done ? "opacity-50" : ""}`}>
      <button
        onClick={() => onToggle(item.id)}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={item.done ? "Mark incomplete" : "Mark done"}
      >
        {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4" />}
      </button>
      <span className={`text-sm flex-1 leading-snug ${item.done ? "line-through text-muted-foreground" : ""}`}>
        {highlight(item.text, query)}
      </span>
      <span className="flex-shrink-0">
        <OwnerSelect owner={item.owner} onChange={(o) => onOwnerChange(item.id, o)} />
      </span>
    </div>
  )
}

// ─── expanded detail panel ────────────────────────────────────────────────────

function VendorDetail({
  vendor, actionState, ownerState, onToggle, onOwnerChange, query,
}: {
  vendor: LinkedInVendor
  actionState: Record<string, boolean>
  ownerState: Record<string, string>
  onToggle: (vendorId: string, actionId: string) => void
  onOwnerChange: (vendorId: string, actionId: string, owner: string) => void
  query: string
}) {
  return (
    <div className="px-4 py-4 space-y-4 bg-muted/20 border-t">
      <div className="grid grid-cols-2 gap-4">
        {/* Left: summary + action items */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Summary</p>
            <p className="text-sm text-foreground leading-relaxed">{highlight(vendor.summary, query)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Integration model</p>
            <p className="text-sm text-foreground leading-relaxed">{highlight(vendor.integrationModel, query)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Action items ({vendor.actionItems.filter((a) => !(actionState[`${vendor.id}-${a.id}`] ?? a.done)).length} open)
            </p>
            {vendor.actionItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No action items.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {vendor.actionItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={{
                      ...item,
                      done: actionState[`${vendor.id}-${item.id}`] ?? item.done,
                      owner: (ownerState[`${vendor.id}-${item.id}`] ?? item.owner) as LiActionItem["owner"],
                    }}
                    onToggle={(id) => onToggle(vendor.id, id)}
                    onOwnerChange={(id, o) => onOwnerChange(vendor.id, id, o)}
                    query={query}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: commercials + meta */}
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pricing</p>
            <p className="text-xs text-foreground">{highlight(vendor.pricing, query)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">White-label</p>
            <div className="flex items-center gap-2 mb-1">{whiteLabelBadge(vendor.whiteLabel)}</div>
            <p className="text-xs text-muted-foreground">{highlight(vendor.whiteLabelNote, query)}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">LinkedIn ban history</p>
            <p className="text-xs text-foreground">{highlight(vendor.banHistory, query)}</p>
          </div>

          {vendor.openQuestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Open questions</p>
              <div className="space-y-1">
                {vendor.openQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <HelpCircle className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{highlight(q, query)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vendor.contacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contacts</p>
              <div className="space-y-0.5">
                {vendor.contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span>{highlight(c, query)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(vendor.website || vendor.granolaLink || vendor.slackChannel || vendor.meetings.length > 0) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Links &amp; meetings</p>
              <div className="space-y-1">
                {vendor.meetings.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Meetings:</span> {vendor.meetings.join(", ")}
                  </div>
                )}
                {vendor.slackChannel && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Slack:</span> {vendor.slackChannel}
                  </div>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
                {vendor.granolaLink && (
                  <a href={vendor.granolaLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink className="h-3 w-3" /> Granola notes
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Summary (comparison) sub-tab ─────────────────────────────────────────────

function SummaryTab({ vendors, query }: { vendors: LinkedInVendor[]; query: string }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Side-by-side of every LinkedIn automation vendor — how they integrate, what they cost, whether white-label is
        on the table, and their LinkedIn account-safety track record.
      </p>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[130px]">Vendor</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="min-w-[260px]">Integration model</TableHead>
              <TableHead className="min-w-[200px]">Pricing</TableHead>
              <TableHead className="w-[110px]">White-label</TableHead>
              <TableHead className="min-w-[200px]">Ban history</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="align-top">
                  <div className="font-semibold text-sm">{highlight(v.name, query)}</div>
                  {v.priority && <div className="text-xs text-muted-foreground">{v.priority}</div>}
                </TableCell>
                <TableCell className="align-top">{statusBadge(v.status)}</TableCell>
                <TableCell className="align-top text-xs text-muted-foreground leading-relaxed">{highlight(v.integrationModel, query)}</TableCell>
                <TableCell className="align-top text-xs text-foreground leading-relaxed">{highlight(v.pricing, query)}</TableCell>
                <TableCell className="align-top">{whiteLabelBadge(v.whiteLabel)}</TableCell>
                <TableCell className="align-top text-xs text-muted-foreground leading-relaxed">{highlight(v.banHistory, query)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Progress (tracker) sub-tab ───────────────────────────────────────────────

function ProgressTab({
  vendors, expandedRows, toggleExpanded, actionState, ownerState,
  toggleAction, changeOwner, getEffectiveDone, getEffectiveOwner, query,
}: {
  vendors: LinkedInVendor[]
  expandedRows: Set<string>
  toggleExpanded: (id: string) => void
  actionState: Record<string, boolean>
  ownerState: Record<string, string>
  toggleAction: (vendorId: string, actionId: string) => void
  changeOwner: (vendorId: string, actionId: string, owner: string) => void
  getEffectiveDone: (vendorId: string, actionId: string, def: boolean) => boolean
  getEffectiveOwner: (vendorId: string, actionId: string, def: string) => string
  query: string
}) {
  if (vendors.length === 0) {
    return <div className="py-12 text-center text-sm text-muted-foreground">No vendors in this view.</div>
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-6"></TableHead>
            <TableHead className="w-[150px]">Vendor</TableHead>
            <TableHead className="w-[90px]">Last contact</TableHead>
            <TableHead className="w-[170px]">Email</TableHead>
            <TableHead>Next action</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => {
            const expanded = expandedRows.has(vendor.id)
            const { text: contactText, color: contactColor } = lastContactLabel(vendor.lastContactDate)
            const openActions = vendor.actionItems.filter((a) => !getEffectiveDone(vendor.id, a.id, a.done))
            const nextOnMe    = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "me")
            const nextOnKevin = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "kevin")
            const nextOnJames = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "james")
            const nextOnThem  = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "them")
            const nextAction = nextOnMe ?? nextOnKevin ?? nextOnJames ?? nextOnThem
            const nextActionOwner = nextAction ? getEffectiveOwner(vendor.id, nextAction.id, nextAction.owner) : null

            return (
              <React.Fragment key={vendor.id}>
                <TableRow className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpanded(vendor.id)}>
                  <TableCell className="text-muted-foreground pr-0">
                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">{vendor.name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.priority}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${contactColor}`}>{contactText}</span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {emailBadge(vendor.emailStatus, vendor.emailSubject)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {nextAction && nextActionOwner ? (
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleAction(vendor.id, nextAction.id)}
                          className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Circle className="h-4 w-4" />
                        </button>
                        <p className="text-xs leading-snug line-clamp-2 flex-1">{nextAction.text}</p>
                        <span className="flex-shrink-0 mt-0.5">
                          <OwnerSelect owner={nextActionOwner} onChange={(o) => changeOwner(vendor.id, nextAction.id, o)} />
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> All done
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(vendor.status)}</TableCell>
                </TableRow>
                {expanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="p-0">
                      <VendorDetail
                        vendor={vendor}
                        actionState={actionState}
                        ownerState={ownerState}
                        onToggle={toggleAction}
                        onOwnerChange={changeOwner}
                        query={query}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

export function LinkedInVendorHub() {
  const [query, setQuery] = React.useState("")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const { actionState, ownerState, setAction, setOwner } = useFollowupState()

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAction = (vendorId: string, actionId: string) => {
    const key = `${vendorId}-${actionId}`
    setAction(key, !actionState[key])
  }
  const changeOwner = (vendorId: string, actionId: string, newOwner: string) => {
    setOwner(`${vendorId}-${actionId}`, newOwner)
  }
  const getEffectiveDone = (vendorId: string, actionId: string, def: boolean) =>
    actionState[`${vendorId}-${actionId}`] ?? def
  const getEffectiveOwner = (vendorId: string, actionId: string, def: string) =>
    ownerState[`${vendorId}-${actionId}`] ?? def

  const filtered = React.useMemo(
    () =>
      linkedinVendors
        .filter((v) => matchesSearch(v, query))
        .sort((a, b) => (PRIORITY_ORDER[a.priority ?? "P2"] ?? 3) - (PRIORITY_ORDER[b.priority ?? "P2"] ?? 3)),
    [query]
  )

  React.useEffect(() => {
    if (query.trim()) {
      setExpandedRows(new Set(linkedinVendors.filter((v) => matchesSearch(v, query)).map((v) => v.id)))
    }
  }, [query])

  // stats
  const activeCount  = linkedinVendors.filter((v) => v.status === "active" || v.status === "meeting-booked").length
  const trialCount   = linkedinVendors.filter((v) => v.status === "trial").length
  const wlCount      = linkedinVendors.filter((v) => v.whiteLabel === "yes" || v.whiteLabel === "partial").length
  const emailCount   = linkedinVendors.filter((v) => v.emailStatus === "needs-response").length
  const onMeCount    = linkedinVendors.filter((v) =>
    v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "me" && !getEffectiveDone(v.id, a.id, a.done))
  ).length

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vendors, pricing, integration model, ban history, notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-border transition"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "In active talks", value: activeCount, color: "text-emerald-700", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Trials in flight", value: trialCount,  color: trialCount > 0 ? "text-violet-700" : "text-muted-foreground", icon: <Clock className="h-4 w-4" /> },
          { label: "White-label path", value: wlCount,     color: "text-emerald-700", icon: <User className="h-4 w-4" /> },
          { label: "Emails need reply", value: emailCount, color: emailCount > 0 ? "text-red-600" : "text-muted-foreground", icon: <Mail className="h-4 w-4" /> },
          { label: "Action on you",     value: onMeCount,  color: onMeCount > 0 ? "text-violet-700" : "text-muted-foreground", icon: <AlertCircle className="h-4 w-4" /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-background px-4 py-3 flex items-center gap-3">
            <span className={stat.color}>{stat.icon}</span>
            <div>
              <div className={`text-2xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs: Summary / Progress */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab vendors={filtered} query={query} />
        </TabsContent>

        <TabsContent value="progress">
          <ProgressTab
            vendors={filtered}
            expandedRows={expandedRows}
            toggleExpanded={toggleExpanded}
            actionState={actionState}
            ownerState={ownerState}
            toggleAction={toggleAction}
            changeOwner={changeOwner}
            getEffectiveDone={getEffectiveDone}
            getEffectiveOwner={getEffectiveOwner}
            query={query}
          />
        </TabsContent>
      </Tabs>

      {query && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {linkedinVendors.length} vendors match &ldquo;{query}&rdquo;
        </p>
      )}

      {/* legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground border-t pt-3">
        <span>Sourced from Slack + Gmail + Granola, compiled 2026-07-28</span>
        <span className="ml-auto flex items-center gap-1.5">
          Owner selectable per action:
          {(["me","kevin","james","them"] as const).map((o) => (
            <span key={o} className={`text-[10px] font-medium rounded-full border px-1.5 py-0 ${OWNER_STYLES[o]}`}>
              {OWNER_LABELS[o]}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
