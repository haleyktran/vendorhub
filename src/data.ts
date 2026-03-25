export type Status = "ready" | "caution" | "blocker" | "pending" | "async"

export interface EndpointResult {
  vendor: string
  endpoint: string
  warmAvg: number | null
  warmP50: number | null
  warmP95: number | null
  coldAvg: number | null
  rateLimit: string
  status: Status
  notes: string
  dataFill: number | null // percent 0–100, null = unknown
  confidence: "high" | "medium" | "low" | "none"
}

export interface TierResult {
  vendor: string
  endpoint: string
  large: number | null
  mid: number | null
  small: number | null
  bootstrapped: number | null
  intl: number | null
}

export interface BurstResult {
  vendor: string
  endpoint: string
  wallMs: number | null
  indAvgMs: number | null
  errors: number
  parallelizes: boolean | null
}

// Best numbers chosen across Run 1, Run 2, historical large run, and SimilarWeb runs
export const summaryData: EndpointResult[] = [
  {
    vendor: "SimilarWeb",
    endpoint: "Traffic & Engagement",
    warmAvg: 136, warmP50: 156, warmP95: 206,
    coldAvg: 113,
    rateLimit: "10 req/s",
    status: "ready",
    notes: "Fastest tested. Cold ≈ warm. No cache bias by company size.",
    dataFill: null,
    confidence: "high",
  },
  {
    vendor: "SimilarWeb",
    endpoint: "Traffic Sources",
    warmAvg: 130, warmP50: 102, warmP95: 211,
    coldAvg: 102,
    rateLimit: "10 req/s",
    status: "ready",
    notes: "Consistent across tiers. Trial key = world-level data only.",
    dataFill: null,
    confidence: "high",
  },
  {
    vendor: "SimilarWeb",
    endpoint: "Batch API",
    warmAvg: null, warmP50: null, warmP95: null,
    coldAvg: null,
    rateLimit: "20 pending jobs",
    status: "async",
    notes: "72–97s end-to-end. Async only — not suitable for real-time enrichment.",
    dataFill: null,
    confidence: "high",
  },
  {
    vendor: "Openmart",
    endpoint: "Search",
    warmAvg: 133, warmP50: 129, warmP95: 153,
    coldAvg: null,
    rateLimit: "No limit in 30 req",
    status: "caution",
    notes: "Strong numbers but cold start unknown. Credits exhausted in recent runs. Trial = limit:1 per query.",
    dataFill: null,
    confidence: "low",
  },
  {
    vendor: "Openmart",
    endpoint: "Enrich Company",
    warmAvg: 386, warmP50: 398, warmP95: 553,
    coldAvg: null,
    rateLimit: "Ran out of credits",
    status: "caution",
    notes: "Only 12 successful responses. Numbers directional only.",
    dataFill: null,
    confidence: "low",
  },
  {
    vendor: "Adyntel",
    endpoint: "Facebook Ads",
    warmAvg: 2371, warmP50: 1574, warmP95: 5825,
    coldAvg: 2066,
    rateLimit: "No 429 in 40 req",
    status: "caution",
    notes: "Cold start ranged 2–10s across runs. High p95. Async use only.",
    dataFill: 28,
    confidence: "medium",
  },
  {
    vendor: "Adyntel",
    endpoint: "LinkedIn Ads",
    warmAvg: 1329, warmP50: 1356, warmP95: 1536,
    coldAvg: 1307,
    rateLimit: "—",
    status: "ready",
    notes: "Cold ≈ warm. Consistent across tiers. Usable synchronously.",
    dataFill: 94,
    confidence: "medium",
  },
  {
    vendor: "Adyntel",
    endpoint: "Google Ads",
    warmAvg: 1393, warmP50: 1415, warmP95: 1585,
    coldAvg: 1424,
    rateLimit: "—",
    status: "ready",
    notes: "Cold ≈ warm. Stable p95. Usable synchronously.",
    dataFill: 83,
    confidence: "medium",
  },
  {
    vendor: "Adyntel",
    endpoint: "Domain Keywords",
    warmAvg: 806, warmP50: 760, warmP95: 1092,
    coldAvg: 874,
    rateLimit: "—",
    status: "ready",
    notes: "Fastest Adyntel endpoint. Cold ≈ warm. Note: 0% data fill logged — may be field-name mismatch.",
    dataFill: 0,
    confidence: "medium",
  },
  {
    vendor: "SE Ranking",
    endpoint: "Domain Overview",
    warmAvg: 965, warmP50: 954, warmP95: 1011,
    coldAvg: 1133,
    rateLimit: "429 after 1–3 req",
    status: "blocker",
    notes: "Latency is fine. Rate limit is a hard blocker at trial tier. No retry-after header.",
    dataFill: 0,
    confidence: "medium",
  },
  {
    vendor: "SE Ranking",
    endpoint: "Backlinks Summary",
    warmAvg: 421, warmP50: 358, warmP95: 850,
    coldAvg: 1629,
    rateLimit: "—",
    status: "caution",
    notes: "High cold/warm gap (1629ms vs 421ms). p95 variance under burst.",
    dataFill: 0,
    confidence: "medium",
  },
  {
    vendor: "SE Ranking",
    endpoint: "Keyword Research",
    warmAvg: 1448, warmP50: 1486, warmP95: 1555,
    coldAvg: 1372,
    rateLimit: "429s under burst",
    status: "caution",
    notes: "Consistent warm latency but burst test hit 429s. Trial-tier restriction likely.",
    dataFill: 100,
    confidence: "medium",
  },
  {
    vendor: "Crunchbase",
    endpoint: "Enrich Company",
    warmAvg: null, warmP50: null, warmP95: null,
    coldAvg: null,
    rateLimit: "—",
    status: "pending",
    notes: "Needs API key.",
    dataFill: null,
    confidence: "none",
  },
  {
    vendor: "BuiltWith",
    endpoint: "Tech Lookup",
    warmAvg: null, warmP50: null, warmP95: null,
    coldAvg: null,
    rateLimit: "—",
    status: "pending",
    notes: "Needs API key.",
    dataFill: null,
    confidence: "none",
  },
  {
    vendor: "HG Insights",
    endpoint: "Tech Intelligence",
    warmAvg: null, warmP50: null, warmP95: null,
    coldAvg: null,
    rateLimit: "—",
    status: "pending",
    notes: "Needs API key.",
    dataFill: null,
    confidence: "none",
  },
]

// Tier data — averaged across Run 1 and Run 2 where both exist
export const tierData: TierResult[] = [
  { vendor: "SimilarWeb", endpoint: "Traffic & Engagement",
    large: 135, mid: 101, small: 99, bootstrapped: null, intl: null },
  { vendor: "Adyntel", endpoint: "Facebook Ads",
    large: 1447, mid: 1803, small: 3095, bootstrapped: 1924, intl: 2013 },
  { vendor: "Adyntel", endpoint: "LinkedIn Ads",
    large: 1393, mid: 1306, small: 1195, bootstrapped: 1259, intl: 1394 },
  { vendor: "Adyntel", endpoint: "Google Ads",
    large: 1474, mid: 1455, small: 1300, bootstrapped: 1516, intl: 1390 },
  { vendor: "Adyntel", endpoint: "Domain Keywords",
    large: 904, mid: 714, small: 893, bootstrapped: 895, intl: 999 },
  { vendor: "SE Ranking", endpoint: "Domain Overview",
    large: 1400, mid: 1078, small: 1002, bootstrapped: 1226, intl: 930 },
  { vendor: "SE Ranking", endpoint: "Backlinks Summary",
    large: 1446, mid: 1280, small: 1504, bootstrapped: 2080, intl: 2055 },
  { vendor: "SE Ranking", endpoint: "Keyword Research",
    large: 1432, mid: 1379, small: 1225, bootstrapped: 1434, intl: 1417 },
]

export const burstData: BurstResult[] = [
  { vendor: "SimilarWeb", endpoint: "Traffic & Engagement",
    wallMs: null, indAvgMs: null, errors: 0, parallelizes: null },
  { vendor: "Adyntel", endpoint: "Facebook Ads",
    wallMs: 1877, indAvgMs: 1709, errors: 0, parallelizes: true },
  { vendor: "Adyntel", endpoint: "LinkedIn Ads",
    wallMs: 1764, indAvgMs: 1474, errors: 0, parallelizes: true },
  { vendor: "Adyntel", endpoint: "Google Ads",
    wallMs: 1713, indAvgMs: 1628, errors: 0, parallelizes: true },
  { vendor: "Adyntel", endpoint: "Domain Keywords",
    wallMs: 2432, indAvgMs: 1451, errors: 0, parallelizes: false },
  { vendor: "SE Ranking", endpoint: "Domain Overview",
    wallMs: 698, indAvgMs: 698, errors: 4, parallelizes: null },
  { vendor: "SE Ranking", endpoint: "Backlinks Summary",
    wallMs: 5261, indAvgMs: 1610, errors: 0, parallelizes: false },
  { vendor: "SE Ranking", endpoint: "Keyword Research",
    wallMs: 1263, indAvgMs: 1263, errors: 4, parallelizes: null },
]

export const runLog = [
  {
    label: "Historical (large run)",
    date: "pre-session",
    file: "zoom.com only · 500 req/endpoint",
    note: "Openmart Search 133ms avg (500/500). Adyntel credits exhausted after FB Ads (165/500). SE Ranking zoom.com only, 5 runs.",
  },
  {
    label: "Run 1",
    date: "2026-03-24",
    file: "results_20260324_121629.txt",
    note: "18 domains across tiers. Openmart 402. Adyntel FB cold=9,826ms. SE Ranking 429 at #3.",
  },
  {
    label: "Run 2",
    date: "2026-03-24",
    file: "results_20260324_125425.txt",
    note: "Rerun to validate Run 1. FB cold=2,066ms (much lower — likely partial cache). SE Ranking 429 at #1.",
  },
  {
    label: "SimilarWeb Run 1–2",
    date: "2026-03-24",
    file: "quicktest 142732 / 142849",
    note: "Invalid params: wrong date range, then no US country access on trial key.",
  },
  {
    label: "SimilarWeb Run 3",
    date: "2026-03-24",
    file: "results_similarweb_quicktest_20260324_143731.txt",
    note: "First valid run. rippling, chameleon, depot.dev. World/monthly. REST avg 78–94ms. Batch 97s.",
  },
  {
    label: "SimilarWeb Run 4 (fresh domains)",
    date: "2026-03-24",
    file: "results_similarweb_quicktest_20260324_144316.txt",
    note: "scale.com, nooks.ai, tracecat.com — genuine cold starts. REST avg 166–193ms. Cold ≈ warm. Batch 72s.",
  },
]
