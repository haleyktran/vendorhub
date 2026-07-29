// ─── LinkedIn Automation Vendors ────────────────────────────────────────────
// Vendors Unify is evaluating for LinkedIn automation (connection requests,
// messaging, sequencing) to embed into the product alongside email sequencing.
//
// Source of truth: Slack + Gmail + Granola notes, compiled 2026-07-28.
// Update this file (or toggle action items in-app) as conversations progress.

export type LiEmailStatus = "needs-response" | "waiting-on-them" | "none"
export type LiActionOwner = "me" | "kevin" | "james" | "them"
export type LiPriority = "P0" | "P1" | "P2" | null

export type LiStatus =
  | "active"          // in active conversation / evaluation
  | "trial"           // trial in progress or being set up
  | "meeting-booked"  // follow-up meeting scheduled
  | "stalled"         // conversation went cold / dead-ended
  | "deprioritized"   // assessed, not a current fit
  | "pending"         // early / no substantive contact yet

export type LiWhiteLabel =
  | "yes"             // white-label available / in progress
  | "partial"         // unbranded now, white-label coming
  | "open"            // open to it, nothing built yet
  | "no"              // not applicable / not offered
  | "unknown"

export interface LiActionItem {
  id: string
  text: string
  owner: LiActionOwner
  done: boolean
}

export interface LinkedInVendor {
  id: string
  name: string
  website?: string
  priority: LiPriority
  status: LiStatus
  lastContactDate: string | null
  emailStatus: LiEmailStatus
  emailSubject?: string

  // ── summary fields (comparison view) ──
  summary: string              // 1–3 sentence overview
  integrationModel: string     // how it plugs in (API, native, desktop, infra)
  pricing: string              // pricing summary
  whiteLabel: LiWhiteLabel
  whiteLabelNote: string       // detail on the white-label / rev-share model
  banHistory: string           // LinkedIn ban / account-safety track record

  // ── progress fields ──
  nextStep: string             // single most important next action
  actionItems: LiActionItem[]
  openQuestions: string[]      // unresolved technical/commercial questions

  // ── meta ──
  contacts: string[]           // ["Name — email"]
  slackChannel?: string
  granolaLink?: string
  meetings: string[]           // ["2026-07-20 intro"], most recent last
  notes: string[]              // searchable context blobs
}

function wl(v: LiWhiteLabel): LiWhiteLabel { return v }

export const linkedinVendors: LinkedInVendor[] = [
  // ── P0 ──────────────────────────────────────────────────────────────────
  {
    id: "heyreach",
    name: "HeyReach",
    website: "https://heyreach.io",
    priority: "P0",
    status: "active",
    lastContactDate: "2026-07-27",
    emailStatus: "waiting-on-them",
    emailSubject: "Awaiting two pricing proposals (white-label vs powered-by) — due Jul 28",
    summary:
      "Multi-account LinkedIn outreach platform that rotates many LinkedIn accounts to scale volume (~800 connection requests per account per month). 55,000 customer accounts active. Furthest along on a true white-label infrastructure path via their 'Backbone' API.",
    integrationModel:
      "API + account rotation. Two models on the table: (1) white-label — Unify buys a HeyReach plan and LinkedIn sequencing lives natively in Unify; (2) brand placement ('powered by HeyReach'), usage-based ~$79/account rev share. Backbone API = full white-label infra, on their Q2 2026 roadmap.",
    pricing:
      "~$79/account (powered-by rev-share model) or bulk white-label pricing. Backbone API carries ~50% revenue share. Two formal proposals requested — due Jul 28.",
    whiteLabel: wl("yes"),
    whiteLabelNote:
      "White-label supported and preferred by Unify. Full white-label infra (Backbone API) was on their Q2 2026 roadmap with ~50% rev share. Awaiting confirmation it's shippable now.",
    banHistory:
      "Mixed — has had C-level / company-page accounts banned by LinkedIn, but reports 55,000 customer accounts remain active. Account-safety guardrails are a key diligence item.",
    nextStep: "Review the two pricing proposals when they land (due today), then send API rate-limit requirements.",
    actionItems: [
      { id: "hr-1", text: "Review HeyReach's two pricing proposals (white-label vs powered-by) — due Jul 28", owner: "me", done: false },
      { id: "hr-2", text: "Send HeyReach our API rate-limit requirements", owner: "me", done: false },
      { id: "hr-3", text: "Request MSA / legal docs via Slack", owner: "me", done: false },
      { id: "hr-4", text: "Confirm Backbone (full white-label) API is available now vs still roadmap", owner: "them", done: false },
    ],
    openQuestions: [
      "Is the Backbone / full white-label API GA yet, or still Q2-2026 roadmap?",
      "What are the account-safety guardrails given prior company-level bans?",
      "Per-account rate limits under the white-label plan?",
    ],
    contacts: ["HeyReach partnerships (via Slack)", "Ilija Stojkovski — ilija@heyreach.io"],
    slackChannel: "#heyreach-unify",
    meetings: ["2026-02-26 intro", "2026-07-27 pricing follow-up"],
    notes: [
      "Rotates multiple LinkedIn accounts to scale volume (~800 connection requests/account/month)",
      "55,000 customer accounts active",
      "Had C-level / company-page accounts banned by LinkedIn",
      "Backbone API (full white-label infra) on Q2 2026 roadmap, ~50% rev share",
      "Two pricing proposals requested, due 2026-07-28",
      "Jul 27 6:00pm meeting scheduling: James Grinage + Kevin Liang coordinated coverage in #heyreach-unify around a HeyReach-side Loom pre-read; substance of the actual pricing call is captured via Granola (see above), Slack itself had no additional commercial detail",
    ],
  },

  {
    id: "unipile",
    name: "Unipile",
    website: "https://www.unipile.com",
    priority: "P0",
    status: "active",
    lastContactDate: "2026-07-26",
    emailStatus: "needs-response",
    emailSubject: "URGENT — 'Your free trial has ended' (Jul 26 10:35pm PT): trial data warned to be deleted within hours unless subscribed; support@unipile.com also sent an unanswered Jul 23 check-in on API testing progress",
    summary:
      "Unified API for LinkedIn, email, WhatsApp and more, with 200,000+ LinkedIn accounts connected. Reverse-engineered approach (no headless browser); proxies matched to each user's location for account safety.",
    integrationModel:
      "REST API. No headless browser — reverse-engineered endpoints with geo-matched proxies. Covers messaging, connection requests, and search.",
    pricing:
      "$5.50 / account / month (minimum plan $55/mo for 1–10 accounts). 7-day free trial available.",
    whiteLabel: wl("unknown"),
    whiteLabelNote:
      "White-label terms not yet confirmed — to be covered once Julien sends the pricing grid + legal docs.",
    banHistory:
      "Briefly banned by LinkedIn ~6–9 months ago, now restored. Recommends conservative daily limits: 100 messages/searches, 50–80 connection invites per account.",
    nextStep: "URGENT: decide whether to subscribe or let the trial lapse — 'trial ended' notice (Jul 26 10:35pm PT) warned trial data would be deleted within hours; unconfirmed whether this was actioned before the deletion window closed.",
    actionItems: [
      { id: "up-5", text: "URGENT — respond to 'Your free trial has ended' notice (Jul 26): confirm whether to subscribe or accept trial data loss", owner: "me", done: false },
      { id: "up-1", text: "Set up shared Slack channel with Julien (Unipile), Kevin, James", owner: "me", done: false },
      { id: "up-2", text: "Julien to send pricing grid, DPA, and MSA", owner: "them", done: false },
      { id: "up-3", text: "Scope and kick off the 7-day API trial", owner: "kevin", done: false },
      { id: "up-4", text: "Reply to support@unipile.com's Jul 23 check-in on API testing progress (still unanswered)", owner: "me", done: false },
    ],
    openQuestions: [
      "White-label / reseller terms and any rev share?",
      "How does the reverse-engineered approach hold up on account-safety at our volume?",
    ],
    contacts: ["Julien — julien@unipile.com"],
    meetings: ["2026-07-20 intro"],
    notes: [
      "API for LinkedIn, email, WhatsApp and more — 200,000+ LinkedIn accounts connected",
      "Reverse-engineered approach (no headless browser); proxies matched to user location",
      "$5.50/account/month; min plan $55/month for 1–10 accounts; 7-day free trial",
      "Recommended daily limits: 100 messages/searches, 50–80 connection invites per account",
      "Briefly banned by LinkedIn ~6–9 months ago, now back",
      "Emailed haley + james + kevinliang on Jul 20 confirming they can support our use cases",
      "Jul 23 10:35pm PT: support@unipile.com sent a check-in asking about API testing progress — unanswered",
      "Jul 26 10:35pm PT: 'Your free trial has ended' notice — warned trial data would be deleted within hours unless Unify subscribes. Unresolved as of Jul 28 whether this was actioned in time.",
    ],
  },

  {
    id: "salesforge",
    name: "Salesforge",
    website: "https://www.salesforge.ai",
    priority: "P0",
    status: "trial",
    lastContactDate: "2026-07-23",
    emailStatus: "waiting-on-them",
    emailSubject: "Salesforge LinkedIn integration — dedicated Slack + trial being set up",
    summary:
      "Full LinkedIn automation via API from the Salesforge/Mailforge team. No LinkedIn ban history. Charges per 'social action' rather than per seat, and offers a fully-invisible white-label with a 20% revenue share back to Unify.",
    integrationModel:
      "API, usage-based on 'social actions'. Enforces a 30 messages/day max. Chrome-extension API relay feasibility still being confirmed by Niels.",
    pricing:
      "Usage-based: 1,000 actions free, then tiered add-ons (e.g. 50 actions for $50). White-label partnership returns 20% revenue share to Unify.",
    whiteLabel: wl("partial"),
    whiteLabelNote:
      "White-label with 20% rev share to Unify; Salesforge fully invisible. White-labeled API keys not ready yet ('coming months') — unbranded keys available in the interim.",
    banHistory: "No LinkedIn ban history reported. Enforces a 30 messages/day cap per account.",
    nextStep: "Start the 2-week free trial; get pricing sheet, MSA, DPA from Niels and confirm Chrome-extension API relay.",
    actionItems: [
      { id: "sf-1", text: "Start the 2-week free trial", owner: "me", done: false },
      { id: "sf-2", text: "Niels to send pricing sheet, MSA, and DPA", owner: "them", done: false },
      { id: "sf-3", text: "Niels to confirm whether Chrome-extension API relay is feasible", owner: "them", done: false },
      { id: "sf-4", text: "Join the dedicated Slack channel (invites sent Jul 23)", owner: "me", done: false },
    ],
    openQuestions: [
      "Can our Chrome extension relay calls to the Salesforge API directly?",
      "When do white-labeled (branded) API keys ship vs. the interim unbranded keys?",
    ],
    contacts: ["Niels Edmonds Ouwens — niels@mailforge.ai", "Maria — maria@mailforge.ai"],
    meetings: ["2026-07-20 intro"],
    notes: [
      "Full LinkedIn automation via API; no ban history; 30 messages/day max enforced",
      "Usage-based — 1,000 actions free, then tiered add-ons (e.g. 50 actions for $50)",
      "White-label: 20% revenue share back to Unify; Salesforge fully invisible",
      "White-labeled API keys not ready yet; unbranded keys available in the interim",
      "Dedicated Slack channel invites sent Jul 23",
      "Charges for 'social actions' rather than seats",
    ],
  },

  // ── P1 ──────────────────────────────────────────────────────────────────
  {
    id: "bearconnect",
    name: "Bear Connect",
    website: "https://bearconnect.io",
    priority: "P1",
    status: "meeting-booked",
    lastContactDate: "2026-07-23",
    emailStatus: "waiting-on-them",
    emailSubject: "Unify x Bearconnect Partnership — Mona to send Friday follow-up times",
    summary:
      "~1-year-old LinkedIn automation tool with 100+ paid users. Supports both inbound and outbound LinkedIn (a differentiator vs. HeyReach) plus post scheduling and AI content creation. Small team (3 engineers).",
    integrationModel:
      "API. Multi-tenancy (per-customer API key separation) flagged by Unify as a requirement they'd need to meet.",
    pricing: "$67 / month flat — unlimited everything, no credit tiers.",
    whiteLabel: wl("open"),
    whiteLabelNote:
      "No formal white-label partnerships yet, but open to exploring. Small 3-engineer team, so build capacity is a question.",
    banHistory: "No LinkedIn bans reported.",
    nextStep: "Get Friday follow-up call times from Mona; bring product + eng leads.",
    actionItems: [
      { id: "bc-1", text: "Receive available times from Bear Connect for a Friday follow-up call", owner: "them", done: false },
      { id: "bc-2", text: "Bring product + eng leads (Kevin/James) to the follow-up", owner: "me", done: false },
      { id: "bc-3", text: "Confirm per-customer API key separation (multi-tenancy) is supportable", owner: "them", done: false },
    ],
    openQuestions: [
      "Can they support multi-tenancy (per-customer API key separation)?",
      "Does a 3-engineer team have capacity to build a white-label partnership?",
    ],
    contacts: ["Mona Juneja — support@bearconnect.io"],
    meetings: ["2026-07-23 intro"],
    notes: [
      "~1 year old, 100+ paid users",
      "Supports both inbound and outbound LinkedIn (differentiator vs HeyReach)",
      "Includes post scheduling and AI content creation",
      "$67/month flat, unlimited everything, no credit tiers",
      "No formal white-label partnerships yet; open to exploring; small tech team (3 engineers)",
      "Multi-tenancy (per-customer API key separation) flagged as a requirement",
    ],
  },

  {
    id: "talkpush",
    name: "Talkpush",
    website: "https://www.talkpush.com",
    priority: "P1",
    status: "active",
    lastContactDate: "2026-07-24",
    emailStatus: "none",
    summary:
      "LinkedIn-only automation with a desktop app. Campaigns pull leads from Sales Navigator via a pasted URL. A custom API exists but not all features are exposed, and CRM integrations currently run only through Zapier.",
    integrationModel:
      "Desktop app today; custom API exists but incomplete. Key unknown: whether Unify can call the Talkpush API directly from our Chrome extension without users ever touching the Talkpush platform.",
    pricing: "Unknown — not yet discussed.",
    whiteLabel: wl("unknown"),
    whiteLabelNote: "No prior white-label partnerships. Model not yet discussed.",
    banHistory: "No LinkedIn bans reported.",
    nextStep: "Review the API docs and send async technical questions; schedule a dev-team follow-up if promising.",
    actionItems: [
      { id: "tp-1", text: "Review Talkpush API docs", owner: "me", done: false },
      { id: "tp-2", text: "Send async technical questions (esp. direct-from-extension API calls)", owner: "me", done: false },
      { id: "tp-3", text: "Schedule follow-up with Talkpush dev team if the API path looks viable", owner: "me", done: false },
    ],
    openQuestions: [
      "Can Unify call Talkpush's API directly from our Chrome extension, with no user contact with Talkpush's platform? (vendor was unsure)",
      "Are all automation features exposed via the API, or desktop-app only?",
    ],
    contacts: ["Talkpush (intro call Jul 24)"],
    meetings: ["2026-07-24 intro"],
    notes: [
      "LinkedIn-only focus; campaigns pull leads from Sales Nav via pasted URL; desktop app only",
      "Custom API exists but not all features exposed; CRM integrations currently via Zapier only",
      "No LinkedIn bans reported; no prior white-label partnerships",
      "Open question: direct API calls from Chrome extension without users touching Talkpush",
    ],
  },

  {
    id: "linkedapi",
    name: "Linked API",
    website: "https://linkedapi.io",
    priority: "P1",
    status: "active",
    lastContactDate: "2026-07-23",
    emailStatus: "needs-response",
    emailSubject: "Partnership Interest [Linked API Support] — they replied with scoping questions",
    summary:
      "LinkedIn API vendor where messaging and connection requests are core capabilities. Confirmed a white-label setup is something they can prepare for Unify. Conversation is email-only so far.",
    integrationModel:
      "API for LinkedIn messaging and connection requests. White-label setup available on request.",
    pricing: "TBD — not yet quoted.",
    whiteLabel: wl("yes"),
    whiteLabelNote:
      "Confirmed they can prepare a white-label setup for Unify (Haley requested this Jul 22). They followed up Jul 23 with scoping questions we still owe answers to.",
    banHistory: "Not yet discussed.",
    nextStep: "Reply to Linked API's Jul 23 scoping questions to move the white-label setup forward.",
    actionItems: [
      { id: "la-1", text: "Answer Linked API's Jul 23 scoping questions (messaging + connection-request white-label)", owner: "me", done: false },
      { id: "la-2", text: "Get connected to the right person on their side after scoping", owner: "them", done: false },
      { id: "la-3", text: "Request pricing once white-label scope is defined", owner: "me", done: false },
    ],
    openQuestions: [
      "Pricing / rev-share for a white-label setup?",
      "Account-safety and ban track record?",
    ],
    contacts: ["Linked API Support — support@linkedapi.io"],
    meetings: [],
    notes: [
      "Messaging and connection requests are core capabilities",
      "White-label setup confirmed as something they can prepare",
      "Haley asked for white-label / messaging + connection-request setup Jul 22",
      "They replied Jul 23 with scoping questions — we owe a response",
      "Email-only so far, no call yet",
    ],
  },

  // ── P2 / holding ──────────────────────────────────────────────────────────
  {
    id: "dripify",
    name: "Dripify",
    website: "https://dripify.io",
    priority: "P2",
    status: "stalled",
    lastContactDate: "2026-07-26",
    emailStatus: "none",
    emailSubject: "Re: Dripify - LinkedIn automation tool — they closed the conversation Jul 26",
    summary:
      "Cloud-based LinkedIn automation tool. We reached out about a partnership, but the conversation was handled as a support ticket and Dripify closed it on Jul 26 (with a CSAT rating request). No partnership path established.",
    integrationModel: "Cloud-based LinkedIn automation (details not scoped — never got past their support desk).",
    pricing: "Not discussed.",
    whiteLabel: wl("unknown"),
    whiteLabelNote: "Never scoped — inbound went to a support queue, not a partnerships contact.",
    banHistory: "Not discussed.",
    nextStep: "Decide whether to re-engage via a real partnerships/BD contact rather than the support channel.",
    actionItems: [
      { id: "dr-1", text: "Decide whether to re-approach Dripify through a BD/partnerships contact (support channel dead-ended)", owner: "me", done: false },
    ],
    openQuestions: [
      "Do they even offer an API / partnership model, or is it self-serve only?",
    ],
    contacts: ["Dripify support — gen.m@dripify.com", "support@dripify.com"],
    meetings: [],
    notes: [
      "Cloud-based LinkedIn automation tool",
      "Reached out about partnership via 'Contact us'",
      "Handled as a support ticket; they closed the conversation Jul 26 and sent a CSAT request",
      "No partnership contact established — likely need a BD/partnerships route to re-engage",
    ],
  },

  {
    id: "anchorbrowser",
    name: "Anchor Browser",
    website: "https://anchorbrowser.io",
    priority: "P2",
    status: "deprioritized",
    lastContactDate: "2026-07-23",
    emailStatus: "none",
    summary:
      "Browser-automation infrastructure (not a LinkedIn-specific tool) — handles CAPTCHA, bot detection, and up to 10,000 RPM. Assessed as not a strong fit for LinkedIn automation because we'd have to build all the orchestration (rate limits, polling, reply tracking) on top.",
    integrationModel:
      "Low-level browser automation infrastructure. Would require Unify to build the full LinkedIn orchestration layer on top.",
    pricing: "Not discussed.",
    whiteLabel: wl("no"),
    whiteLabelNote: "Not applicable — it's infrastructure, not a LinkedIn product.",
    banHistory: "N/A — general browser infra (handles CAPTCHA / bot detection).",
    nextStep: "Hold. Revisit only for niche / agentic browser-automation use cases later.",
    actionItems: [
      { id: "ab-1", text: "Keep on file for future agentic / niche browser-automation use cases", owner: "me", done: true },
    ],
    openQuestions: [],
    contacts: ["Gabi Weinberg — gabi@anchorbrowser.io", "Nadav — nadav@anchorbrowser.io"],
    meetings: ["2026-07-13 intro", "2026-07-23 follow-up"],
    notes: [
      "Browser automation infrastructure (not LinkedIn-specific); handles CAPTCHA, bot detection, up to 10,000 RPM",
      "Not a strong fit — building full orchestration (rate limits, polling, reply tracking) on top is too large a lift",
      "No pricing discussed; door left open for future niche/agentic use cases",
    ],
  },
]
