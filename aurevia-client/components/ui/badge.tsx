import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors font-cormorant"
  
  const variantClasses = {
    default: "border-transparent bg-copper-accent text-walnut-dark hover:bg-copper-accent/80",
    secondary: "border-transparent bg-copper-accent/20 text-copper-accent hover:bg-copper-accent/30",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
    outline: "border-copper-accent/30 text-cream-light hover:bg-copper-accent/20",
  }

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)} 
      {...props} 
    />
  )
}

export { Badge }
