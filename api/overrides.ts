import type { VercelRequest, VercelResponse } from "@vercel/node"

const KEY = "vendor-hub-overrides-v1"

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function redisGet(): Promise<Record<string, unknown>> {
  const res = await fetch(`${REDIS_URL}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  })
  const json = await res.json() as { result: string | null }
  return json.result ? JSON.parse(json.result) : {}
}

async function redisSet(data: unknown) {
  const encoded = encodeURIComponent(JSON.stringify(data))
  await fetch(`${REDIS_URL}/set/${KEY}?ex=2592000`, {  // 30-day TTL
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([KEY, JSON.stringify(data)]),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store")

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: "Redis not configured" })
  }

  if (req.method === "GET") {
    try {
      const data = await redisGet()
      return res.status(200).json(data)
    } catch {
      return res.status(200).json({})
    }
  }

  if (req.method === "PUT") {
    try {
      await redisSet(req.body)
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: String(e) })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
