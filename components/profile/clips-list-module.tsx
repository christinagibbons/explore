"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Play, Clock, Calendar, ChevronRight } from "lucide-react"
import { MOCK_DATASETS } from "@/lib/mock-datasets"
import type { PlayData } from "@/lib/play-data"
import type { Athlete } from "@/types/athlete"

interface ClipsListModuleProps {
  athlete: Athlete & { id: string }
  onClickClip?: (clip: PlayData) => void
  onClickPlaylist?: (playlistId: string, playlistName: string) => void
}

// Mock playlists that contain this athlete
const MOCK_PLAYLISTS = [
  { id: "pl-1", name: "Week 12 Highlights", clipCount: 24, updatedAt: "2 days ago" },
  { id: "pl-2", name: "Red Zone Opportunities", clipCount: 18, updatedAt: "5 days ago" },
  { id: "pl-3", name: "Third Down Conversions", clipCount: 31, updatedAt: "1 week ago" },
  { id: "pl-4", name: "Pressures & Sacks", clipCount: 15, updatedAt: "1 week ago" },
]

export function ClipsListModule({ athlete, onClickClip, onClickPlaylist }: ClipsListModuleProps) {
  // Get recent clips featuring this athlete (mock)
  const recentClips = useMemo(() => {
    return MOCK_DATASETS[0]?.plays.slice(0, 8) || []
  }, [])

  return (
    <div className="h-full bg-background rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Clips & Playlists</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Content featuring {athlete.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Playlists Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Playlists</span>
            <span className="text-xs text-muted-foreground">{MOCK_PLAYLISTS.length} playlists</span>
          </div>
          <div className="space-y-1">
            {MOCK_PLAYLISTS.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => onClickPlaylist?.(playlist.id, playlist.name)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">{playlist.clipCount} clips · {playlist.updatedAt}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Clips Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Clips</span>
            <span className="text-xs text-muted-foreground">{recentClips.length} clips</span>
          </div>
          <div className="space-y-1">
            {recentClips.map((clip, idx) => (
              <button
                key={clip.id}
                onClick={() => onClickClip?.(clip)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left group"
                )}
              >
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 relative">
                  <Play className="w-4 h-4 text-muted-foreground" />
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] font-medium text-muted-foreground bg-background/80 px-1 rounded">
                    0:{String(15 + idx * 3).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{clip.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{clip.gameInfo?.awayTeam} @ {clip.gameInfo?.homeTeam}</span>
                    <span className="text-border">·</span>
                    <span>Q{clip.gameInfo?.quarter}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
