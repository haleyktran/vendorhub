import * as React from "react"
import type { VendorCommercial } from "@/vendorCommercialData"

export type CommercialOverride = Partial<VendorCommercial> & {
  commercialStatus?: "ready" | "wait" | "blocked" | null
}

const STORAGE_KEY = "vendor-hub-commercial-overrides-v1"

function load(): Record<string, CommercialOverride> {
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
