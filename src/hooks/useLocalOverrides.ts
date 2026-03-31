import * as React from "react"
import type { VendorCommercial } from "@/vendorCommercialData"

export type CommercialOverride = Partial<VendorCommercial> & {
  commercialStatus?: "ready" | "wait" | "blocked" | null
  questionnaireUrl?: string
}

const STORAGE_KEY = "vendor-hub-commercial-overrides-v1"
const SHARE_PARAM = "share"

// If the URL has a ?share= param, import those overrides into localStorage
function loadFromShareParam(): Record<string, CommercialOverride> | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get(SHARE_PARAM)
    if (!encoded) return null
    const data = JSON.parse(atob(encoded)) as Record<string, CommercialOverride>
    // Save into localStorage and clean the URL
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const url = new URL(window.location.href)
    url.searchParams.delete(SHARE_PARAM)
    window.history.replaceState(null, "", url.toString())
    return data
  } catch {
    return null
  }
}

function load(): Record<string, CommercialOverride> {
  const shared = loadFromShareParam()
  if (shared) return shared
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(overrides: Record<string, CommercialOverride>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function makeShareUrl(overrides: Record<string, CommercialOverride>): string {
  const encoded = btoa(JSON.stringify(overrides))
  const url = new URL(window.location.href)
  url.searchParams.set(SHARE_PARAM, encoded)
  return url.toString()
}

export function useLocalOverrides() {
  const [overrides, setOverrides] = React.useState<Record<string, CommercialOverride>>(load)

  const setField = React.useCallback(
    <K extends keyof CommercialOverride>(vendorId: string, field: K, value: CommercialOverride[K]) => {
      setOverrides(prev => {
        const next = { ...prev, [vendorId]: { ...prev[vendorId], [field]: value } }
        save(next)
        return next
      })
    },
    []
  )

  const resetVendor = React.useCallback((vendorId: string) => {
    setOverrides(prev => {
      const next = { ...prev }
      delete next[vendorId]
      save(next)
      return next
    })
  }, [])

  const hasOverrides = React.useCallback(
    (vendorId: string) => !!overrides[vendorId] && Object.keys(overrides[vendorId]).length > 0,
    [overrides]
  )

  return { overrides, setField, resetVendor, hasOverrides }
}
