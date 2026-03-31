import type { VercelRequest, VercelResponse } from "@vercel/node"

const KEY = "vendor-hub-overrides-v1"
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function headers() {
  return { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" }
}

async function redisGet(): Promise<Record<string, unknown>> {
  const res = await fetch(`${REDIS_URL}/get/${KEY}`, { headers: headers() })
  const json = await res.json() as { result: string | null }
  return json.result ? JSON.parse(json.result) : {}
}

async function redisSet(data: unknown) {
  // Use pipeline so large JSON values don't end up in the URL
  await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify([["SET", KEY, JSON.stringify(data), "EX", 2592000]]),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store")

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(503).json({ error: "Redis not configured" })
  }

  if (req.method === "GET") {
    try {
      return res.status(200).json(await redisGet())
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
