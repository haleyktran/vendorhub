import * as React from "react"
import type { VendorCommercial } from "@/vendorCommercialData"

export type CommercialOverride = Partial<VendorCommercial> & {
  commercialStatus?: "ready" | "wait" | "review" | "blocked" | null
  questionnaireUrl?: string
}

const STORAGE_KEY = "vendor-hub-commercial-overrides-v1"
const API_URL = "/api/overrides"
const POLL_MS = 8000 // poll every 8 seconds

function loadLocal(): Record<string, CommercialOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocal(overrides: Record<string, CommercialOverride>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

async function fetchRemote(): Promise<Record<string, CommercialOverride>> {
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error("fetch failed")
  return res.json()
}

async function pushRemote(overrides: Record<string, CommercialOverride>) {
  await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides),
  })
}

export function useLocalOverrides() {
  const [overrides, setOverrides] = React.useState<Record<string, CommercialOverride>>(loadLocal)

  // Apply and persist a new overrides object
  const apply = React.useCallback((next: Record<string, CommercialOverride>) => {
    saveLocal(next)
    setOverrides(next)
  }, [])

  // Poll remote every POLL_MS — update local if remote is different
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
          const localHasData = Object.keys(local).length > 0
          const remoteEmpty = Object.keys(remote).length === 0

          if (localHasData && remoteEmpty) {
            // First load: local has edits but remote is blank — push local up
            await pushRemote(local)
          } else {
            // Remote has data (or both empty) — remote wins
            apply(remote)
          }
        } else {
          // Subsequent polls — remote always wins
          apply(remote)
        }
      } catch {
        // silently ignore — keep local state
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [apply])

  const setField = React.useCallback(
    <K extends keyof CommercialOverride>(vendorId: string, field: K, value: CommercialOverride[K]) => {
      setOverrides(prev => {
        const next = { ...prev, [vendorId]: { ...prev[vendorId], [field]: value } }
        saveLocal(next)
        pushRemote(next) // push immediately
        return next
      })
    },
    []
  )

  const resetVendor = React.useCallback((vendorId: string) => {
    setOverrides(prev => {
      const next = { ...prev }
      delete next[vendorId]
      saveLocal(next)
      pushRemote(next)
      return next
    })
  }, [])

  const hasOverrides = React.useCallback(
    (vendorId: string) => !!overrides[vendorId] && Object.keys(overrides[vendorId]).length > 0,
    [overrides]
  )

  return { overrides, setField, resetVendor, hasOverrides }
}
