"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOCK_DATASETS } from "@/lib/mock-datasets"
import type { PlayData } from "@/lib/play-data"

interface PlaylistPreviewProps {
  title: string
  athleteName?: string
  onClose?: () => void
  onClickClip?: (clip: PlayData) => void
  onViewFullPlaylist?: () => void
}

export function PlaylistPreview({ title, athleteName, onClose, onClickClip, onViewFullPlaylist }: PlaylistPreviewProps) {
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Get clips from mock data
  const clips = useMemo(() => {
    return MOCK_DATASETS[0]?.plays.slice(0, 12) || []
  }, [])
  
  const currentClip = clips[currentClipIndex]
  
  const handleClipClick = (index: number) => {
    setCurrentClipIndex(index)
    if (onClickClip && clips[index]) {
      onClickClip(clips[index])
    }
  }
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }
  
  if (!currentClip) return null

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          {athleteName && (
            <p className="text-xs text-muted-foreground">{athleteName} · {clips.length} clips</p>
          )}
          {!athleteName && (
            <p className="text-xs text-muted-foreground">{clips.length} clips</p>
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
        
        {/* Current clip info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm font-medium text-white truncate">{currentClip.title}</p>
          <p className="text-xs text-white/70">{currentClip.date}</p>
        </div>
        
        {/* Clip counter */}
        <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-0.5">
          <span className="text-xs text-white font-medium">{currentClipIndex + 1} / {clips.length}</span>
        </div>
      </div>
      
      {/* Playlist clips list */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-2">
          {clips.map((clip, index) => {
            const isActive = index === currentClipIndex
            return (
              <button
                key={clip.id}
                onClick={() => handleClipClick(index)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                  isActive 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
              >
                {/* Thumbnail */}
                <div className={cn(
                  "w-20 aspect-video rounded bg-muted flex items-center justify-center shrink-0 relative overflow-hidden",
                  isActive && "ring-2 ring-primary"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40" />
                  {isActive && isPlaying ? (
                    <Pause className="w-4 h-4 text-white relative z-10" />
                  ) : (
                    <Play className="w-4 h-4 text-white relative z-10 ml-0.5" />
                  )}
                  {/* Duration badge */}
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[10px] text-white px-1 rounded">
                    0:{String(30 + (index * 7) % 30).padStart(2, "0")}
                  </span>
                </div>
                
                {/* Clip info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {clip.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {clip.date}
                  </p>
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Fixed Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          className="flex-1 font-semibold"
          onClick={() => {
            console.log("Add to playlist:", title)
          }}
        >
          Add to Playlist
        </Button>
        <Button
          className="flex-1 font-semibold"
          onClick={onViewFullPlaylist}
        >
          View Full Playlist
        </Button>
      </div>
    </div>
  )
}
