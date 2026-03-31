import type { VercelRequest, VercelResponse } from "@vercel/node"

const REPO = "haleyktran/vendorhub"
const FILE = "overrides.json"
const API  = `https://api.github.com/repos/${REPO}/contents/${FILE}`

async function getFile() {
  const res = await fetch(API, {
    headers: { Authorization: `token ${process.env.GITHUB_SYNC_TOKEN}` },
  })
  if (!res.ok) throw new Error("GitHub GET failed")
  const json = await res.json() as { content: string; sha: string }
  const content = JSON.parse(Buffer.from(json.content, "base64").toString("utf8"))
  return { content, sha: json.sha }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Cache-Control", "no-store")

  if (req.method === "OPTIONS") return res.status(200).end()

  if (req.method === "GET") {
    try {
      const { content } = await getFile()
      return res.status(200).json(content)
    } catch {
      return res.status(200).json({})
    }
  }

  if (req.method === "PUT") {
    try {
      const { sha } = await getFile()
      const encoded = Buffer.from(JSON.stringify(req.body)).toString("base64")
      await fetch(API, {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_SYNC_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "sync overrides",
          content: encoded,
          sha,
        }),
      })
      return res.status(200).json({ ok: true })
    } catch (e) {
      return res.status(500).json({ error: String(e) })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
