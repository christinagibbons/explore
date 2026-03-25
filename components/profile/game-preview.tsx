"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOCK_DATASETS } from "@/lib/mock-datasets"

interface GameData {
  week: string
  opponent: string
  result: string
  statLine: string
  grade: number
}

interface GamePreviewProps {
  game: GameData
  athleteName?: string
  onClose?: () => void
  onWatchFullGame?: () => void
}

export function GamePreview({ game, athleteName, onClose, onWatchFullGame }: GamePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Get clips from mock data to show highlights
  const highlights = useMemo(() => {
    return MOCK_DATASETS[0]?.plays.slice(0, 6) || []
  }, [])
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }
  
  const isWin = game.result.startsWith("W")

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {game.week} vs {game.opponent}
          </h3>
          {athleteName && (
            <p className="text-xs text-muted-foreground">{athleteName}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-2"
          aria-label="Close preview"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Video Player Area */}
      <div className="relative aspect-video bg-black shrink-0">
        {/* Placeholder for video */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <button 
            onClick={togglePlayback}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>
        
        {/* Game info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm font-medium text-white">
            {game.week} vs {game.opponent}
          </p>
          <p className={cn(
            "text-xs font-medium",
            isWin ? "text-emerald-400" : "text-red-400"
          )}>
            {game.result}
          </p>
        </div>
      </div>
      
      {/* Game Stats Summary */}
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Player Stats</p>
            <p className="text-sm font-medium text-foreground">{game.statLine}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Grade</p>
            <span className={cn(
              "inline-flex items-center justify-center px-2 py-0.5 rounded text-sm font-semibold",
              game.grade >= 80 ? "bg-emerald-500/10 text-emerald-500" :
              game.grade >= 70 ? "bg-primary/10 text-primary" :
              game.grade >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
            )}>
              {game.grade.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Game Highlights ({highlights.length})
          </h4>
        </div>
        <div className="px-2">
          {highlights.map((clip, index) => (
            <button
              key={clip.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-muted/50"
            >
              {/* Thumbnail */}
              <div className="w-20 aspect-video rounded bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40" />
                <Play className="w-4 h-4 text-white relative z-10 ml-0.5" />
                {/* Duration badge */}
                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[10px] text-white px-1 rounded">
                  0:{String(30 + (index * 7) % 30).padStart(2, "0")}
                </span>
              </div>
              
              {/* Clip info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {clip.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Q{clip.quarter} · {clip.down}&{clip.distance}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          className="flex-1 font-semibold"
          onClick={() => {
            console.log("Add highlights to playlist")
          }}
        >
          Add Highlights
        </Button>
        <Button
          className="flex-1 font-semibold"
          onClick={onWatchFullGame}
        >
          Watch Full Game
        </Button>
      </div>
    </div>
  )
}
