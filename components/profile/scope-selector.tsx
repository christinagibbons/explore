"use client"

import { ChevronDown } from "lucide-react"
import { useProfileContext, SCOPE_OPTIONS, type ProfileScope } from "./profile-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ScopeSelectorProps {
  className?: string
}

export function ScopeSelector({ className }: ScopeSelectorProps) {
  const { scope, setScope } = useProfileContext()
  
  const currentLabel = SCOPE_OPTIONS.find(opt => opt.value === scope)?.label || "2025 Season"
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
            "bg-muted/50 hover:bg-muted border border-border/50",
            "text-sm font-medium text-foreground transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            className
          )}
        >
          <span>{currentLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {SCOPE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setScope(option.value)}
            className={cn(
              "cursor-pointer",
              scope === option.value && "bg-primary/10 text-primary font-medium"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
