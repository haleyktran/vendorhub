import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  vendorContacts,
  type VendorContact,
  type ActionItem,
  type EmailStatus,
  type VendorStatus,
  type CommercialStatus,
} from "@/vendorHubData"
import {
  Search,
  Mail,
  Clock,
  CheckCircle2,
  Circle,
  Key,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Hourglass,
  ExternalLink,
  User,
} from "lucide-react"

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

function emailBadge(status: EmailStatus, subject?: string) {
  if (status === "needs-response")
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="red" className="flex items-center gap-1 w-fit">
          <Mail className="h-3 w-3" />
          Needs reply
        </Badge>
        {subject && (
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{subject}</span>
        )}
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

function commercialBadge(status: CommercialStatus) {
  if (status === "ready")
    return <span title="🟢 Ready — start commercial conversation now" className="text-base leading-none">🟢</span>
  if (status === "wait")
    return <span title="🟡 Wait — follow-up in motion" className="text-base leading-none">🟡</span>
  if (status === "blocked")
    return <span title="🔴 Blocked / Hold — action needed before quote" className="text-base leading-none">🔴</span>
  return <span className="text-muted-foreground text-xs">—</span>
}

function statusBadge(status: VendorStatus) {
  const map: Record<VendorStatus, { label: string; variant: "green" | "yellow" | "red" | "gray" | "purple" }> = {
    active:          { label: "Active",          variant: "green" },
    trial:           { label: "Trial",           variant: "purple" },
    "meeting-booked":{ label: "Meeting",         variant: "yellow" },
    blocked:         { label: "Blocked",         variant: "red" },
    "do-not-contact":{ label: "Do not contact",  variant: "gray" },
    pending:         { label: "Pending",         variant: "gray" },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

const OWNER_STYLES: Record<string, string> = {
  me:   "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200",
  will: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
  them: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
}
const OWNER_LABELS: Record<string, string> = { me: "Haley", will: "Will", them: "Vendor" }

function OwnerSelect({
  owner,
  onChange,
}: {
  owner: string
  onChange: (o: string) => void
}) {
  return (
    <select
      value={owner}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value) }}
      onClick={(e) => e.stopPropagation()}
      className={`text-[10px] font-medium rounded-full border px-1.5 py-0 h-4 cursor-pointer appearance-none outline-none transition-colors ${OWNER_STYLES[owner] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
      title="Change owner"
    >
      <option value="me">Haley</option>
      <option value="will">Will</option>
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

function matchesSearch(vendor: VendorContact, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    vendor.name.toLowerCase().includes(q) ||
    vendor.signal.toLowerCase().includes(q) ||
    vendor.category.toLowerCase().includes(q) ||
    vendor.notes.some((n) => n.toLowerCase().includes(q)) ||
    vendor.actionItems.some((a) => a.text.toLowerCase().includes(q)) ||
    vendor.contacts.some((c) => c.toLowerCase().includes(q)) ||
    (vendor.emailSubject?.toLowerCase().includes(q) ?? false) ||
    (vendor.pricing?.toLowerCase().includes(q) ?? false)
  )
}

function getMatchingNotes(vendor: VendorContact, query: string): string[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return vendor.notes.filter((n) => n.toLowerCase().includes(q))
}

// ─── action item row ──────────────────────────────────────────────────────────

function ActionItemRow({
  item,
  onToggle,
  onOwnerChange,
  query,
}: {
  item: ActionItem
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
        {item.done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
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
  vendor,
  actionState,
  ownerState,
  onToggle,
  onOwnerChange,
  query,
}: {
  vendor: VendorContact
  actionState: Record<string, boolean>
  ownerState: Record<string, string>
  onToggle: (vendorId: string, actionId: string) => void
  onOwnerChange: (vendorId: string, actionId: string, owner: string) => void
  query: string
}) {
  const matchingNotes = getMatchingNotes(vendor, query)

  return (
    <div className="px-4 py-4 space-y-4 bg-muted/20 border-t">
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Signal + Actions */}
        <div className="space-y-4">
          {/* Signal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Signal overview</p>
            <p className="text-sm text-foreground leading-relaxed">{highlight(vendor.signal, query)}</p>
          </div>

          {/* Action items */}
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
                      owner: (ownerState[`${vendor.id}-${item.id}`] ?? item.owner) as ActionItem["owner"],
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

        {/* Right: Meta + Links */}
        <div className="space-y-3 text-sm">
          {/* Contacts */}
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

          {/* Pricing */}
          {vendor.pricing && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pricing</p>
              <p className="text-xs text-foreground">{highlight(vendor.pricing, query)}</p>
            </div>
          )}

          {/* Links */}
          {(vendor.granolaLink || vendor.attentionLink || vendor.slackChannel) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Links</p>
              <div className="space-y-1">
                {vendor.slackChannel && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Slack:</span>
                    <span>{vendor.slackChannel}</span>
                  </div>
                )}
                {vendor.granolaLink && (
                  <a
                    href={vendor.granolaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Granola notes
                  </a>
                )}
                {vendor.attentionLink && (
                  <a
                    href={vendor.attentionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Attention recording
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matching notes (search only) */}
      {matchingNotes.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Matching context
          </p>
          <div className="space-y-1">
            {matchingNotes.map((note, i) => (
              <div key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-border flex-shrink-0">·</span>
                <span>{highlight(note, query)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

type FilterTab = "all" | "me" | "will" | "them" | "ready" | "blocked" | "pending"

export function VendorHub() {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<FilterTab>("all")
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [actionState, setActionState] = React.useState<Record<string, boolean>>({})
  const [ownerState, setOwnerState] = React.useState<Record<string, string>>({})

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAction = (vendorId: string, actionId: string) => {
    const key = `${vendorId}-${actionId}`
    setActionState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const changeOwner = (vendorId: string, actionId: string, newOwner: string) => {
    const key = `${vendorId}-${actionId}`
    setOwnerState((prev) => ({ ...prev, [key]: newOwner }))
  }

  const getEffectiveDone = (vendorId: string, actionId: string, defaultDone: boolean) =>
    actionState[`${vendorId}-${actionId}`] ?? defaultDone

  const getEffectiveOwner = (vendorId: string, actionId: string, defaultOwner: string) =>
    ownerState[`${vendorId}-${actionId}`] ?? defaultOwner

  // ── filter logic ─────────────────────────────────────────────────────────

  const filtered = vendorContacts.filter((v) => {
    if (!matchesSearch(v, query)) return false
    if (filter === "me")
      return v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "me" && !getEffectiveDone(v.id, a.id, a.done))
    if (filter === "will")
      return v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "will" && !getEffectiveDone(v.id, a.id, a.done))
    if (filter === "them")
      return v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "them" && !getEffectiveDone(v.id, a.id, a.done))
    if (filter === "ready")   return v.commercialStatus === "ready"
    if (filter === "blocked") return v.commercialStatus === "blocked" || v.overallStatus === "blocked"
    if (filter === "pending") return v.overallStatus === "pending" || v.overallStatus === "meeting-booked"
    return true
  })

  // ── quick stats ──────────────────────────────────────────────────────────

  const emailCount  = vendorContacts.filter((v) => v.emailStatus === "needs-response").length
  const onMeCount   = vendorContacts.filter((v) => v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "me"   && !getEffectiveDone(v.id, a.id, a.done))).length
  const onWillCount = vendorContacts.filter((v) => v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "will" && !getEffectiveDone(v.id, a.id, a.done))).length
  const onThemCount = vendorContacts.filter((v) => v.actionItems.some((a) => getEffectiveOwner(v.id, a.id, a.owner) === "them" && !getEffectiveDone(v.id, a.id, a.done))).length
  const readyCount  = vendorContacts.filter((v) => v.commercialStatus === "ready").length

  // ── auto-expand rows with search matches ──────────────────────────────────

  React.useEffect(() => {
    if (query.trim()) {
      const matchIds = vendorContacts.filter((v) => matchesSearch(v, query)).map((v) => v.id)
      setExpandedRows(new Set(matchIds))
    }
  }, [query])

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all",     label: "All",              count: vendorContacts.filter(v => v.overallStatus !== "do-not-contact").length },
    { key: "me",      label: "Action on you",    count: onMeCount },
    { key: "will",    label: "Action on Will",   count: onWillCount },
    { key: "them",    label: "Waiting on them",  count: onThemCount },
    { key: "ready",   label: "🟢 Ready",          count: readyCount },
    { key: "blocked", label: "🔴 Blocked",        count: vendorContacts.filter(v => v.commercialStatus === "blocked").length },
    { key: "pending", label: "Upcoming",          count: vendorContacts.filter(v => v.overallStatus === "meeting-booked").length },
  ]

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vendors, notes, contacts, pricing, signal context..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-border transition"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Emails need reply", value: emailCount, color: emailCount > 0 ? "text-red-600" : "text-muted-foreground", icon: <Mail className="h-4 w-4" /> },
          { label: "Action on you",     value: onMeCount,   color: onMeCount > 0   ? "text-violet-700" : "text-muted-foreground", icon: <AlertCircle className="h-4 w-4" /> },
          { label: "Action on Will",    value: onWillCount, color: onWillCount > 0 ? "text-emerald-700" : "text-muted-foreground", icon: <User className="h-4 w-4" /> },
          { label: "Waiting on them",   value: onThemCount, color: onThemCount > 0 ? "text-amber-700" : "text-muted-foreground", icon: <Clock className="h-4 w-4" /> },
          { label: "🟢 Ready to close",  value: readyCount,  color: readyCount > 0  ? "text-emerald-700" : "text-muted-foreground", icon: <CheckCircle2 className="h-4 w-4" /> },
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

      {/* Filter tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 text-sm rounded-t transition-colors relative -mb-px whitespace-nowrap ${
              filter === tab.key
                ? "text-foreground font-medium border border-b-background bg-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${filter === tab.key ? "bg-muted" : "bg-muted/60"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {query ? `No vendors match "${query}"` : "No vendors in this view."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-6"></TableHead>
                <TableHead className="w-[160px]">Vendor</TableHead>
                <TableHead className="w-[90px]">Last contact</TableHead>
                <TableHead className="w-[160px]">Email</TableHead>
                <TableHead className="w-[50px] text-center" title="Commercial status from Will's brief">$$</TableHead>
                <TableHead className="w-[70px] text-center">Key / Tests</TableHead>
                <TableHead>Next action</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vendor) => {
                const expanded = expandedRows.has(vendor.id)
                const { text: contactText, color: contactColor } = lastContactLabel(vendor.lastContactDate)
                const openActions = vendor.actionItems.filter((a) => !getEffectiveDone(vendor.id, a.id, a.done))
                const nextOnMe   = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "me")
                const nextOnWill = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "will")
                const nextOnThem = openActions.find((a) => getEffectiveOwner(vendor.id, a.id, a.owner) === "them")
                const nextAction = nextOnMe ?? nextOnWill ?? nextOnThem
                const nextActionOwner = nextAction ? getEffectiveOwner(vendor.id, nextAction.id, nextAction.owner) : null

                return (
                  <React.Fragment key={vendor.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpanded(vendor.id)}
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
                          {vendor.category}
                        </div>
                      </TableCell>

                      {/* last contact */}
                      <TableCell>
                        <span className={`text-sm font-medium ${contactColor}`}>{contactText}</span>
                      </TableCell>

                      {/* email */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {emailBadge(vendor.emailStatus, vendor.emailSubject)}
                      </TableCell>

                      {/* commercial status */}
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {commercialBadge(vendor.commercialStatus)}
                      </TableCell>

                      {/* key / tests */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span title={vendor.hasApiKey ? "API key obtained" : "No API key yet"}
                            className={vendor.hasApiKey ? "text-emerald-600" : "text-gray-300"}>
                            <Key className="h-3.5 w-3.5" />
                          </span>
                          <span title={vendor.latencyTestRun ? "Latency tests run" : "Tests not run"}
                            className={vendor.latencyTestRun ? "text-emerald-600" : "text-gray-300"}>
                            <FlaskConical className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </TableCell>

                      {/* next action */}
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
                              <OwnerSelect
                                owner={nextActionOwner}
                                onChange={(o) => changeOwner(vendor.id, nextAction.id, o)}
                              />
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            All done
                          </div>
                        )}
                      </TableCell>

                      {/* status */}
                      <TableCell>{statusBadge(vendor.overallStatus)}</TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="p-0">
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
      )}

      {/* search count */}
      {query && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {vendorContacts.length} vendors match &ldquo;{query}&rdquo;
        </p>
      )}

      {/* legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground border-t pt-3">
        <span>🟢 Ready for commercial conversation</span>
        <span>🟡 Wait — follow-up in motion</span>
        <span>🔴 Blocked — needs proposal/estimate first</span>
        <span className="ml-auto flex items-center gap-1.5">
          Owner selectable per action:
          {(["me","will","them"] as const).map(o => (
            <span key={o} className={`text-[10px] font-medium rounded-full border px-1.5 py-0 ${OWNER_STYLES[o]}`}>
              {OWNER_LABELS[o]}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
