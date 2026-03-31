import { kv } from "@vercel/kv"
import type { VercelRequest, VercelResponse } from "@vercel/node"

const KEY = "vendor-hub-overrides-v1"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") return res.status(200).end()

  if (req.method === "GET") {
    const data = await kv.get(KEY)
    return res.status(200).json(data ?? {})
  }

  if (req.method === "PUT") {
    await kv.set(KEY, req.body)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
