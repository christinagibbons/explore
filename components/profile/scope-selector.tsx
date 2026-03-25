"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProfileContext, AVAILABLE_SEASONS, type ScopeType, type SeasonYear } from "./profile-context"

const SCOPE_LABELS: Record<ScopeType, string> = {
  current: "Current Season",
  career: "Career",
  custom: "Custom",
}

export function ScopeSelector() {
  const { scope, setScope } = useProfileContext()
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [selectedSeasons, setSelectedSeasons] = useState<SeasonYear[]>(scope.customSeasons || [])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleScopeSelect = (type: ScopeType) => {
    if (type === "custom") {
      setShowCustomPicker(true)
    } else {
      setScope({ type })
      setIsOpen(false)
      setShowCustomPicker(false)
    }
  }

  const toggleSeason = (season: SeasonYear) => {
    setSelectedSeasons((prev) => 
      prev.includes(season) 
        ? prev.filter((s) => s !== season)
        : [...prev, season].sort((a, b) => Number(b) - Number(a))
    )
  }

  const applyCustomSeasons = () => {
    if (selectedSeasons.length > 0) {
      setScope({ type: "custom", customSeasons: selectedSeasons })
    }
    setIsOpen(false)
    setShowCustomPicker(false)
  }

  const getDisplayLabel = () => {
    if (scope.type === "custom" && scope.customSeasons?.length) {
      if (scope.customSeasons.length === 1) {
        return `${scope.customSeasons[0]} Season`
      }
      return `${scope.customSeasons.length} Seasons`
    }
    return SCOPE_LABELS[scope.type]
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
          "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
          isOpen && "bg-muted text-foreground"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{getDisplayLabel()}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {!showCustomPicker ? (
            <div className="py-1">
              {(["current", "career", "custom"] as ScopeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleScopeSelect(type)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                    "hover:bg-muted",
                    scope.type === type && type !== "custom" && "text-primary"
                  )}
                >
                  <span>{SCOPE_LABELS[type]}</span>
                  {scope.type === type && type !== "custom" && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                  {type === "custom" && (
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 pb-2 mb-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Select Seasons</span>
              </div>
              <div className="space-y-0.5">
                {AVAILABLE_SEASONS.map((season) => (
                  <button
                    key={season}
                    onClick={() => toggleSeason(season)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors",
                      "hover:bg-muted",
                      selectedSeasons.includes(season) && "text-primary"
                    )}
                  >
                    <span>{season} Season</span>
                    {selectedSeasons.includes(season) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 pt-2 mt-2 border-t border-border flex gap-2">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={applyCustomSeasons}
                  disabled={selectedSeasons.length === 0}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    selectedSeasons.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
