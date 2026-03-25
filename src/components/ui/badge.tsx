import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground text-background",
        green: "border-transparent bg-emerald-100 text-emerald-800",
        yellow: "border-transparent bg-amber-100 text-amber-800",
        red: "border-transparent bg-red-100 text-red-800",
        gray: "border-transparent bg-gray-100 text-gray-600",
        purple: "border-transparent bg-violet-100 text-violet-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
