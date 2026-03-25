import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}
const TabsContext = React.createContext<TabsContextValue>({ active: "", setActive: () => {} })

function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [active, setActive] = React.useState(defaultValue)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground gap-1", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = React.useContext(TabsContext)
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        active === value
          ? "bg-background text-foreground shadow"
          : "hover:bg-background/60 hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active } = React.useContext(TabsContext)
  if (active !== value) return null
  return <div className={cn("mt-4", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
