"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Icon } from "@/components/icon"
import { cn } from "@/lib/utils"
import { VIDEO_POOL } from "@/lib/mock-datasets"
import { athletes, getAthleteByName } from "@/lib/athletes-data"
import { useLibraryContext } from "@/lib/library-context"
import { useRouter } from "next/navigation"
import type { PlayData } from "@/lib/mock-datasets"
import type { Athlete } from "@/types/athlete"
import type { ClipData } from "@/types/library"
import type { Game } from "@/types/game"
import { findTeamById, mockClips } from "@/lib/games-context"
import { mockGames } from "@/lib/mock-games"
import { getAthletesForTeam } from "@/lib/mock-teams"
import type { Team } from "@/lib/sports-data"


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractVideoId(url: string | null) {
  if (!url) return null
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

function formatTime(seconds: number) {
  if (!seconds) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/** Deterministic hash from a string to pick consistent data per play. */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

/** Generate a deterministic video URL for a play. */
function getVideoForPlay(play: PlayData): string {
  const idx = hashString(play.id) % VIDEO_POOL.length
  return VIDEO_POOL[idx]
}

// ---------------------------------------------------------------------------
// Play summary generation
// ---------------------------------------------------------------------------

const PASS_DIRECTIONS = ["short left", "short right", "short middle", "deep left", "deep right", "deep middle"]
const RUN_DIRECTIONS_DESC = ["left end", "left tackle", "left guard", "up the middle", "right guard", "right tackle", "right end"]

/** Generate a human-readable summary like "Q1 11:25 . 2nd & 6 at BUF 3 . J. Cook run left, gain of 7 yards . Tackled by J. Poyer" */
function generatePlaySummary(play: PlayData): string {
  const parts: string[] = []
  const h = hashString(play.id)

  // Quarter + game clock
  const clockMin = (h % 12) + 1
  const clockSec = h % 60
  parts.push(`Q${play.quarter} ${clockMin}:${clockSec.toString().padStart(2, "0")}`)

  // Down & distance at yardline
  const ordinal = play.down === 1 ? "1st" : play.down === 2 ? "2nd" : play.down === 3 ? "3rd" : "4th"
  const gameParts = play.game.split(" vs ")
  const teamAbbr = gameParts[0]?.split(" ")[0] || "OWN"
  parts.push(`${ordinal} & ${play.distance} at ${teamAbbr} ${play.yardLineNumeric}`)

  // Play description with player name
  const offensePlayers = athletes.filter((a) => ["QB", "RB", "WR", "TE"].includes(a.position))
  const defPlayers = athletes.filter((a) => ["LB", "CB", "S", "DE", "DT"].includes(a.position))
  const primaryPlayer = offensePlayers[h % offensePlayers.length]
  const tackler = defPlayers[(h + 3) % defPlayers.length]
  const pInitial = primaryPlayer.name.split(" ")[0][0]
  const pLast = primaryPlayer.name.split(" ").slice(1).join(" ")
  const tInitial = tackler.name.split(" ")[0][0]
  const tLast = tackler.name.split(" ").slice(1).join(" ")

  if (play.playType === "Pass") {
    const dir = PASS_DIRECTIONS[h % PASS_DIRECTIONS.length]
    if (play.passResult === "Complete") {
      const receiver = offensePlayers[(h + 7) % offensePlayers.length]
      const rInitial = receiver.name.split(" ")[0][0]
      const rLast = receiver.name.split(" ").slice(1).join(" ")
      parts.push(
        `#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} pass ${dir} to #${receiver.jersey_number} ${rInitial}. ${rLast} for ${play.yards} yards`
      )
    } else if (play.passResult === "Incomplete") {
      parts.push(`#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} pass ${dir} incomplete`)
    } else if (play.passResult === "Sack") {
      parts.push(`#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} sacked for loss of ${play.yards}`)
    } else if (play.passResult === "Interception") {
      parts.push(`#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} pass ${dir} INTERCEPTED`)
    } else {
      parts.push(`#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} pass ${dir}`)
    }
  } else if (play.playType === "Run") {
    const dir = RUN_DIRECTIONS_DESC[h % RUN_DIRECTIONS_DESC.length]
    const gainWord = play.gainLoss === "Gn" ? `gain of ${play.yards} yards` : `loss of ${play.yards}`
    parts.push(`#${primaryPlayer.jersey_number} ${pInitial}. ${pLast} run ${dir}, ${gainWord}`)
  } else {
    parts.push(`special teams play for ${play.yards} yards`)
  }

  // Tackled by
  if (play.playType !== "Special Teams" && play.passResult !== "Incomplete" && play.passResult !== "Interception") {
    parts.push(`Tackled by ${tInitial}. ${tLast}`)
  }

  if (play.isTouchdown) parts.push("TOUCHDOWN")

  return parts.join("  \u2022  ")
}

// ---------------------------------------------------------------------------
// Source type + score helpers
// ---------------------------------------------------------------------------

type SourceType = "GAME" | "PRACTICE" | "SCOUT"

function getSourceType(play: PlayData): SourceType {
  const g = play.game.toLowerCase()
  if (g.includes("practice") || g.includes("drill")) return "PRACTICE"
  if (g.includes("scout")) return "SCOUT"
  return "GAME"
}

function getGameScore(play: PlayData): string | null {
  const source = getSourceType(play)
  if (source !== "GAME") return null
  const h = hashString(play.id)
  const gameParts = play.game.split(" vs ")
  const team1 = gameParts[0]?.split(" ")[0] || "HOME"
  const team2 = gameParts[1]?.split(" ")[0] || "AWAY"
  const score1 = 10 + (h % 28)
  const score2 = 3 + ((h + 5) % 31)
  return `${team1} ${score1} - ${score2}`
}

// ---------------------------------------------------------------------------
// 22-player roster assignment (deterministic per play)
// ---------------------------------------------------------------------------

interface PlayerOnField {
  name: string
  position: string
  jersey_number: number
}

interface PlayRoster {
  offense: PlayerOnField[]
  defense: PlayerOnField[]
}

const OL_PLAYERS: PlayerOnField[] = [
  { name: "Penei Sewell", position: "LT", jersey_number: 58 },
  { name: "Quenton Nelson", position: "LG", jersey_number: 56 },
  { name: "Creed Humphrey", position: "C", jersey_number: 52 },
  { name: "Zack Martin", position: "RG", jersey_number: 70 },
  { name: "Tristan Wirfs", position: "RT", jersey_number: 78 },
]

const EXTRA_DL: PlayerOnField[] = [
  { name: "Jalen Carter", position: "DT", jersey_number: 98 },
  { name: "Calijah Kancey", position: "DT", jersey_number: 93 },
]

function assignPlayRoster(play: PlayData): PlayRoster {
  const h = hashString(play.id)

  const byPosition: Record<string, Athlete[]> = {}
  for (const a of athletes) {
    if (!byPosition[a.position]) byPosition[a.position] = []
    byPosition[a.position].push(a)
  }

  const offense: PlayerOnField[] = []

  // QB x1
  const qbs = byPosition["QB"] || []
  if (qbs.length > 0) {
    const qb = qbs[h % qbs.length]
    offense.push({ name: qb.name, position: "QB", jersey_number: qb.jersey_number })
  }

  // RB x1
  const rbs = byPosition["RB"] || []
  if (rbs.length > 0) {
    const rb = rbs[(h + 1) % rbs.length]
    offense.push({ name: rb.name, position: "RB", jersey_number: rb.jersey_number })
  }

  // WR x3
  const wrs = byPosition["WR"] || []
  for (let i = 0; i < 3 && wrs.length > 0; i++) {
    const wr = wrs[(h + 2 + i) % wrs.length]
    offense.push({ name: wr.name, position: "WR", jersey_number: wr.jersey_number })
  }

  // TE x1
  const tes = byPosition["TE"] || []
  if (tes.length > 0) {
    const te = tes[(h + 5) % tes.length]
    offense.push({ name: te.name, position: "TE", jersey_number: te.jersey_number })
  }

  // OL x5
  offense.push(...OL_PLAYERS)

  const defense: PlayerOnField[] = []

  // DE x2
  const des = byPosition["DE"] || []
  for (let i = 0; i < 2 && des.length > 0; i++) {
    const de = des[(h + i) % des.length]
    defense.push({ name: de.name, position: "DE", jersey_number: de.jersey_number })
  }

  // DT x1
  const dts = byPosition["DT"] || []
  if (dts.length > 0) {
    const dt = dts[h % dts.length]
    defense.push({ name: dt.name, position: "DT", jersey_number: dt.jersey_number })
  }

  // LB x2
  const lbs = byPosition["LB"] || []
  for (let i = 0; i < 2 && lbs.length > 0; i++) {
    const lb = lbs[(h + i) % lbs.length]
    defense.push({ name: lb.name, position: "LB", jersey_number: lb.jersey_number })
  }

  // CB x2
  const cbs = byPosition["CB"] || []
  for (let i = 0; i < 2 && cbs.length > 0; i++) {
    const cb = cbs[(h + i) % cbs.length]
    defense.push({ name: cb.name, position: "CB", jersey_number: cb.jersey_number })
  }

  // S x2
  const ss = byPosition["S"] || []
  for (let i = 0; i < 2 && ss.length > 0; i++) {
    const s = ss[(h + i) % ss.length]
    defense.push({ name: s.name, position: "S", jersey_number: s.jersey_number })
  }

  // Extra DL to reach 11
  defense.push(...EXTRA_DL)

  return { offense, defense }
}

// ---------------------------------------------------------------------------
// YouTube declarations
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// ---------------------------------------------------------------------------
// Camera Angle Menu
// ---------------------------------------------------------------------------

const CAMERA_ANGLES = ["Sideline", "Endzone", "Wide Endzone", "TV", "Scoreboard"] as const

function AngleMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-semibold text-foreground hover:bg-background/95 transition-colors"
        >
          <Icon name="record" className="w-3.5 h-3.5" />
          <span>{CAMERA_ANGLES.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-1"
        side="top"
        align="start"
      >
        <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Camera Angles</div>
        {CAMERA_ANGLES.map((angle) => (
          <button
            key={angle}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
          >
            <Icon name="record" className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{angle}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// PreviewVideoPlayer
// ---------------------------------------------------------------------------

function PreviewVideoPlayer({
  videoUrl,
  sourceType,
  score,
  onOpenClip,
}: {
  videoUrl: string
  sourceType: SourceType
  score: string | null
  onOpenClip: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const playerIdRef = useRef(`preview-player-${Date.now()}`)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      const videoId = extractVideoId(videoUrl)
      if (!videoId) return

      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById({ videoId, startSeconds: 0 })
        return
      }

      playerRef.current = new window.YT.Player(playerIdRef.current, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          mute: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true)
            setDuration(event.target.getDuration())
            if (event.target.isMuted()) setIsMuted(true)
            setVolume(event.target.getVolume())
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === 1)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [videoUrl])

  useEffect(() => {
    if (isPlaying && isPlayerReady) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
          if (duration === 0) setDuration(playerRef.current.getDuration())
        }
      }, 500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, isPlayerReady, duration])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const handleSeek = (value: number[]) => {
    if (!playerRef.current) return
    const newTime = value[0]
    setCurrentTime(newTime)
    playerRef.current.seekTo(newTime, true)
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (!playerRef.current) return
    const newVol = value[0]
    setVolume(newVol)
    playerRef.current.setVolume(newVol)
    if (newVol === 0 && !isMuted) {
      playerRef.current.mute()
      setIsMuted(true)
    } else if (newVol > 0 && isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video bg-black flex flex-col relative overflow-hidden rounded-lg"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="relative flex-1 bg-black">
        <div id={playerIdRef.current} className="h-full w-full" />
        <div className="absolute inset-0 bg-transparent" onClick={togglePlay} />
      </div>

      {/* Persistent overlays (always visible) */}
      {/* Top left: Source type badge */}
      <div className="absolute top-2 left-2 z-30">
        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-foreground/80 text-background">
          {sourceType}
        </span>
      </div>

      {/* Top right: Score */}
      {score && (
        <div className="absolute top-2 right-2 z-30">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold tabular-nums bg-foreground/80 text-background">
            {score}
          </span>
        </div>
      )}

      {/* Bottom left: Angle switcher */}
      <div className="absolute bottom-2 left-2 z-30">
        <AngleMenu />
      </div>

      {/* Bottom right: Open Clip button */}
      <div className="absolute bottom-2 right-2 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenClip()
          }}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icon name="share" className="w-3 h-3" />
          Open Clip
        </button>
      </div>

      {/* Hover controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-2 transition-opacity duration-300 flex flex-col gap-1.5 z-20",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" onClick={togglePlay} className="text-white hover:bg-white/20 h-7 w-7">
              <Icon name={isPlaying ? "pause" : "play"} className="w-4 h-4 fill-current" />
            </Button>

            <div className="flex items-center gap-1.5 group/vol">
              <Button variant="ghost" size="icon-sm" onClick={toggleMute} className="text-white hover:bg-white/20 h-7 w-7">
                <Icon name={isMuted ? "volumeMute" : "volume"} className="w-4 h-4" />
              </Button>
              <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-300">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-16"
                />
              </div>
            </div>

            <span className="text-[11px] text-white/90 font-medium tabular-nums ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Player Chip
// ---------------------------------------------------------------------------

function PlayerChip({ player, onClick }: { player: PlayerOnField; onClick?: () => void }) {
  const nameParts = player.name.split(" ")
  const firstInitial = nameParts[0][0]
  const lastName = nameParts.slice(1).join(" ")

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 text-xs whitespace-nowrap transition-colors hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 cursor-pointer"
    >
      <span className="font-bold text-foreground">
        {firstInitial}. {lastName}
      </span>
      <span className="text-muted-foreground">
        {player.position} #{player.jersey_number}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Athlete Profile View
// ---------------------------------------------------------------------------

const PROFILE_TABS = ["Overview", "Games", "Events", "Career", "Report"] as const

/** Return position-relevant stats for an NFL player */
function getKeyStatsForAthlete(athlete: Athlete): { label: string; value: string; secondary?: string; note?: string }[] {
  const s = athlete.stats
  const pos = athlete.position

  if (pos === "QB") {
    return [
      { label: "Pass Yards", value: s.passing_yards.toLocaleString(), secondary: `/ ${s.passing_tds} TDs`, note: "Career total" },
      { label: "Passer Rating", value: ((s.passing_tds / Math.max(s.passing_yards / 250, 1)) * 30 + 65).toFixed(1), note: "Estimated" },
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Dual threat" },
      { label: "Total TDs", value: (s.passing_tds + s.rushing_tds).toString(), note: "Pass + Rush" },
      { label: "YPG", value: (s.passing_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Comp %", value: (58 + (hashString(athlete.name) % 12)).toFixed(1) + "%", note: "Estimated" },
    ]
  }

  if (pos === "RB") {
    return [
      { label: "Rush Yards", value: s.rushing_yards.toLocaleString(), secondary: `/ ${s.rushing_tds} TDs`, note: "Career total" },
      { label: "YPC", value: (s.rushing_yards / Math.max((s.rushing_yards / 4.5), 1)).toFixed(1), note: "Yards per carry" },
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Receiving" },
      { label: "Total TDs", value: (s.rushing_tds + s.receiving_tds).toString(), note: "Rush + Rec" },
      { label: "Scrimmage", value: (s.rushing_yards + s.receiving_yards).toLocaleString(), note: "Total yards" },
      { label: "Rush YPG", value: (s.rushing_yards / 17).toFixed(1), note: "Yards per game avg" },
    ]
  }

  if (pos === "WR" || pos === "TE") {
    return [
      { label: "Rec Yards", value: s.receiving_yards.toLocaleString(), secondary: `/ ${s.receiving_tds} TDs`, note: "Career total" },
      { label: "Rec/Game", value: ((s.receiving_yards / 12) / 17).toFixed(1), note: "Receptions avg" },
      { label: "YPR", value: (s.receiving_yards / Math.max(s.receiving_yards / 12, 1)).toFixed(1), note: "Yards per reception" },
      { label: "Total TDs", value: (s.receiving_tds + s.rushing_tds).toString(), note: "All touchdowns" },
      { label: "Rec YPG", value: (s.receiving_yards / 17).toFixed(1), note: "Yards per game avg" },
      { label: "Targets", value: Math.round(s.receiving_yards / 8.5).toLocaleString(), note: "Estimated" },
    ]
  }

  if (pos === "OL") {
    const h = hashString(athlete.name)
    const proB = 2 + (h % 5)
    const allPro = 1 + (h % 3)
    const snaps = 850 + (h % 250)
    const penPct = (1.2 + (h % 20) / 10).toFixed(1)
    const sackAllow = (h % 5)
    const runBlock = (78 + (h % 15)).toFixed(1)
    return [
      { label: "Pro Bowls", value: proB.toString(), note: "Career selections" },
      { label: "All-Pro", value: allPro.toString(), note: "First-team nods" },
      { label: "Snaps", value: snaps.toLocaleString(), note: "2025 season" },
      { label: "Penalty %", value: penPct + "%", note: "Of total snaps" },
      { label: "Sacks Allowed", value: sackAllow.toString(), note: "2025 season" },
      { label: "Run Block", value: runBlock, note: "PFF grade" },
    ]
  }

  if (pos === "DE" || pos === "DT") {
    return [
      { label: "Sacks", value: s.sacks.toFixed(1), note: "Career total" },
      { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
      { label: "TFL", value: Math.round(s.sacks * 1.4 + 8).toString(), note: "Tackles for loss" },
      { label: "QB Hits", value: Math.round(s.sacks * 2.2 + 5).toString(), note: "Estimated" },
      { label: "Sacks/Game", value: (s.sacks / 34).toFixed(2), note: "Per game avg" },
      { label: "FF", value: Math.round(s.sacks * 0.3 + 1).toString(), note: "Forced fumbles" },
    ]
  }

  if (pos === "LB") {
    return [
      { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
      { label: "Sacks", value: s.sacks.toFixed(1), note: "Career total" },
      { label: "TFL", value: Math.round(s.sacks * 1.5 + 12).toString(), note: "Tackles for loss" },
      { label: "Tkl/Game", value: (s.tackles / 34).toFixed(1), note: "Per game avg" },
      { label: "PD", value: Math.round(s.tackles * 0.08 + 3).toString(), note: "Pass deflections" },
      { label: "INT", value: Math.round(s.tackles * 0.02 + 1).toString(), note: "Interceptions" },
    ]
  }

  // CB / S
  return [
    { label: "Tackles", value: s.tackles.toString(), note: "Career total" },
    { label: "INT", value: Math.round(s.tackles * 0.04 + 2).toString(), note: "Interceptions" },
    { label: "PD", value: Math.round(s.tackles * 0.12 + 5).toString(), note: "Pass deflections" },
    { label: "Tkl/Game", value: (s.tackles / 34).toFixed(1), note: "Per game avg" },
    { label: "Sacks", value: s.sacks.toFixed(1), note: "Blitz production" },
    { label: "FF", value: Math.round(s.tackles * 0.015 + 1).toString(), note: "Forced fumbles" },
  ]
}

const TEAM_FULL_NAMES: Record<string, string> = {
  BAL: "Baltimore Ravens", BUF: "Buffalo Bills", KC: "Kansas City Chiefs",
  DET: "Detroit Lions", CIN: "Cincinnati Bengals", HOU: "Houston Texans",
  SF: "San Francisco 49ers", PHI: "Philadelphia Eagles", MIN: "Minnesota Vikings",
  MIA: "Miami Dolphins", DAL: "Dallas Cowboys", LAR: "Los Angeles Rams",
  NYJ: "New York Jets", ATL: "Atlanta Falcons", LV: "Las Vegas Raiders",
  CLE: "Cleveland Browns", NYG: "New York Giants", PIT: "Pittsburgh Steelers",
  DEN: "Denver Broncos", IND: "Indianapolis Colts", NE: "New England Patriots",
  TB: "Tampa Bay Buccaneers",
}

function AthleteProfileView({ athlete, onBack, onNavigateToTeam }: { athlete: Athlete; onBack: () => void; onNavigateToTeam?: (team: Team) => void }) {
  const [profileTab, setProfileTab] = useState<typeof PROFILE_TABS[number]>("Overview")
  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const athleteTeam = useMemo(() => findTeamById(athlete.team), [athlete.team])

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Header with back button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Back to clip"
        >
          <Icon name="chevronLeft" className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground truncate">Player Profile</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar + Name + Team/Position - matching Figma design */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0">
            {athlete.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight truncate">{athlete.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {athleteTeam && (
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: athleteTeam.logoColor }}
                >
                  {athleteTeam.abbreviation.slice(0, 2)}
                </div>
              )}
              {athleteTeam && onNavigateToTeam ? (
                <button
                  onClick={() => onNavigateToTeam(athleteTeam)}
                  className="text-foreground underline cursor-pointer"
                >
                  {teamName}
                </button>
              ) : (
                <span>{teamName}</span>
              )}
              <span className="text-border">{"·"}</span>
              <span>{athlete.position}</span>
              <span className="text-border">{"·"}</span>
              <span>#{athlete.jersey_number}</span>
            </div>
          </div>
        </div>

        {/* Profile tabs */}
        <div className="px-5 pb-4 flex items-center gap-1.5 overflow-x-auto">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setProfileTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                profileTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {profileTab === "Overview" ? (
          <div className="px-5 pb-6">
            {/* Identity section */}
            <h3 className="text-lg font-bold text-foreground mb-3">Identity</h3>
            <div className="flex flex-col">
              <IdentityRow label="Height / Weight" value={`${athlete.height} / ${athlete.weight} lbs`} />
              <IdentityRow label="Position" value={athlete.position} />
              <IdentityRow label="Jersey" value={`#${athlete.jersey_number}`} />
              <IdentityRow label="College" value={athlete.college} />
              <IdentityRow 
                label="Team" 
                value={teamName} 
                isLast 
                onClick={athleteTeam && onNavigateToTeam ? () => onNavigateToTeam(athleteTeam) : undefined}
              />
            </div>

            {/* Key Stats */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Key Stats</h3>
                <span className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-2.5 py-1">
                  2025/26
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {keyStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs font-bold text-primary mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-foreground italic">{stat.value}</span>
                      {stat.secondary && (
                        <span className="text-xs text-muted-foreground">{stat.secondary}</span>
                      )}
                    </div>
                    {stat.note && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{stat.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            {profileTab} content coming soon.
          </div>
        )}
      </div>
    </div>
  )
}

function IdentityRow({ label, value, isLast, onClick }: { label: string; value: string; isLast?: boolean; onClick?: () => void }) {
  return (
  <div className={cn("flex items-center justify-between py-3", !isLast && "border-b border-dotted border-border")}>
  <span className="text-sm font-bold text-foreground">{label}</span>
  {onClick ? (
    <button onClick={onClick} className="text-sm text-primary font-medium hover:underline cursor-pointer">
      {value}
    </button>
  ) : (
    <span className="text-sm text-muted-foreground">{value}</span>
  )}
  </div>
  )
  }

// ---------------------------------------------------------------------------
// Convert PlayData to ClipData
// ---------------------------------------------------------------------------

function playToClip(play: PlayData): ClipData {
  return {
    id: play.id,
    playNumber: play.playNumber,
    odk: play.odk,
    quarter: play.quarter,
    down: play.down,
    distance: play.distance,
    yardLine: play.yardLine,
    hash: play.hash,
    yards: play.yards,
    result: play.result,
    gainLoss: play.gainLoss,
    defFront: play.defFront,
    defStr: play.defStr,
    coverage: play.coverage,
    blitz: play.blitz,
    game: play.game,
    playType: play.playType,
    passResult: play.passResult,
    runDirection: play.runDirection,
    personnelO: play.personnelO,
    personnelD: play.personnelD,
    isTouchdown: play.isTouchdown,
    isFirstDown: play.isFirstDown,
    isPenalty: play.isPenalty,
    penaltyType: play.penaltyType,
  }
}

// ---------------------------------------------------------------------------
// Format game label for header
// ---------------------------------------------------------------------------

function formatGameLabel(game: string): string {
  // e.g. "BUF vs LA 01.01.26" -> "01.01.26 BUF @ LA"
  const parts = game.split(" vs ")
  if (parts.length === 2) {
    const team1 = parts[0].trim()
    const team2Parts = parts[1].trim().split(" ")
    if (team2Parts.length >= 2) {
      const team2 = team2Parts[0]
      const date = team2Parts.slice(1).join(" ")
      return `${date} ${team1} @ ${team2}`
    }
    return game
  }
  return game
}

// ---------------------------------------------------------------------------
// Global tag store – shared across all clips
// ---------------------------------------------------------------------------

const ALL_TAGS_KEY = "__preview_all_tags__"

function loadAllTags(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(ALL_TAGS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function persistAllTags(tags: string[]) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ALL_TAGS_KEY, JSON.stringify(tags))
}

function loadClipTags(playId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(`__clip_tags_${playId}__`)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function persistClipTags(playId: string, tags: string[]) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(`__clip_tags_${playId}__`, JSON.stringify(tags))
}

interface ClipNote {
  id: string
  text: string
  authorName: string
  authorAvatar: string
  timestamp: number // ms since epoch
}

let _noteIdCounter = 0
function generateNoteId(): string {
  _noteIdCounter += 1
  return `note-${Date.now()}-${_noteIdCounter}`
}

const DEFAULT_USER = {
  name: "Dan Campbell",
  avatar: "/placeholder.svg?height=40&width=40",
}

function loadClipNotes(playId: string): ClipNote[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(`__clip_notes_${playId}__`)
    return raw ? (JSON.parse(raw) as ClipNote[]) : []
  } catch {
    return []
  }
}

function persistClipNotes(playId: string, notes: ClipNote[]) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(`__clip_notes_${playId}__`, JSON.stringify(notes))
}

// ---------------------------------------------------------------------------
// Sample note seeding – ~33% of clips get pre-populated notes
// ---------------------------------------------------------------------------

const SAMPLE_NOTE_AUTHORS = [
  { name: "Ben Johnson", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Aaron Glenn", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Hank Fraley", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Kelvin Sheppard", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Deshea Townsend", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Scottie Montgomery", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Antwaan Randle El", avatar: "/placeholder.svg?height=40&width=40" },
  { name: "Matt Allison", avatar: "/placeholder.svg?height=40&width=40" },
]

const SAMPLE_NOTE_TEXTS = [
  "Great pocket presence on this play. QB had time to work through his progressions cleanly.",
  "Watch the left guard here -- missed the stunt pickup. Need to drill this in practice.",
  "Coverage busted on the back end. Looks like a communication issue between the safety and corner.",
  "Good run fit by the linebacker. He stayed disciplined in his gap assignment.",
  "The motion pre-snap created the mismatch we wanted. Let's run this look more in the red zone.",
  "Receiver ran a sharp route here. The break at the top was crisp and created separation.",
  "D-line got great push up the middle on this snap. Interior pressure forced the early throw.",
  "Need to review the protection call here -- we left the edge rusher unblocked.",
  "Play action worked perfectly. Both linebackers bit on the fake and left the seam wide open.",
  "This is a good example of a contested catch drill scenario. Receiver showed strong hands.",
  "Personnel grouping gave us the look we wanted. Defense stayed in base and we had numbers.",
  "Blitz pickup was clean. RB identified the rusher and picked it up without hesitation.",
]

const SEEDED_NOTES_KEY = "__preview_notes_seeded__"

function seedSampleNotes() {
  if (typeof window === "undefined") return
  if (sessionStorage.getItem(SEEDED_NOTES_KEY)) return

  // Deterministic selection of play IDs that get notes (~33%)
  // Covers plays from multiple datasets
  const seededPlayIds = [
    "play-0", "play-2", "play-5", "play-8",                     // dataset-a (BUF vs LA)
    "play-1", "play-4", "play-9",                                // dataset-b (Practice)
    "play-3", "play-7", "play-11", "play-14",                    // dataset-c (Scrimmage)
    "play-0", "play-6", "play-12", "play-17",                    // dataset-d (SF vs PHI) -- note: these keys differ once accessed via getAllUniqueClips
    "dataset-a-play-0", "dataset-a-play-2", "dataset-a-play-5",
    "dataset-b-play-1", "dataset-b-play-4",
    "dataset-c-play-3", "dataset-c-play-7", "dataset-c-play-11",
    "dataset-d-play-6", "dataset-d-play-12", "dataset-d-play-17",
  ]

  const now = Date.now()

  seededPlayIds.forEach((playId, idx) => {
    // Skip if notes already exist for this clip
    const existing = sessionStorage.getItem(`__clip_notes_${playId}__`)
    if (existing) return

    const noteCount = (idx % 3) + 1 // 1, 2, or 3 notes per clip
    const notes: ClipNote[] = []

    for (let n = 0; n < noteCount; n++) {
      const author = SAMPLE_NOTE_AUTHORS[(idx + n) % SAMPLE_NOTE_AUTHORS.length]
      const text = SAMPLE_NOTE_TEXTS[(idx * 3 + n) % SAMPLE_NOTE_TEXTS.length]
      // Spread timestamps out: oldest first, ranging from 3 days ago to 10 mins ago
      const ageMs = (noteCount - n) * (1000 * 60 * 60 * (2 + idx % 72))
      notes.push({
        id: `seed-${playId}-${n}`,
        text,
        authorName: author.name,
        authorAvatar: author.avatar,
        timestamp: now - ageMs,
      })
    }

    sessionStorage.setItem(`__clip_notes_${playId}__`, JSON.stringify(notes))
  })

  sessionStorage.setItem(SEEDED_NOTES_KEY, "true")
}

// Run once on load
if (typeof window !== "undefined") {
  seedSampleNotes()
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth} month${diffMonth > 1 ? "s" : ""} ago`
}

// ---------------------------------------------------------------------------
// Tags & Notes Tab
// ---------------------------------------------------------------------------

function TagsAndNotesTab({ playId }: { playId: string }) {
  const [allTags, setAllTags] = useState<string[]>(() => loadAllTags())
  const [clipTags, setClipTags] = useState<string[]>(() => loadClipTags(playId))
  const [notes, setNotes] = useState<ClipNote[]>(() => loadClipNotes(playId))
  const [noteText, setNoteText] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState("")
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState("")
  const tagInputRef = useRef<HTMLInputElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  // Reload per-clip data when the playId changes
  useEffect(() => {
    setClipTags(loadClipTags(playId))
    setNotes(loadClipNotes(playId))
    setNoteText("")
    setEditingNoteId(null)
    setEditingNoteText("")
  }, [playId])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
        setTagSearch("")
      }
    }
    if (tagDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [tagDropdownOpen])

  const filteredTags = useMemo(() => {
    const q = tagSearch.toLowerCase().trim()
    if (!q) return allTags
    return allTags.filter((t) => t.toLowerCase().includes(q))
  }, [allTags, tagSearch])

  const canCreateNew = tagSearch.trim().length > 0 && !allTags.some((t) => t.toLowerCase() === tagSearch.trim().toLowerCase())

  const addTag = (tag: string) => {
    const normalised = tag.trim()
    if (!normalised) return
    // Add to global tags list if new
    if (!allTags.some((t) => t.toLowerCase() === normalised.toLowerCase())) {
      const updated = [...allTags, normalised]
      setAllTags(updated)
      persistAllTags(updated)
    }
    // Add to clip tags if not already present
    if (!clipTags.some((t) => t.toLowerCase() === normalised.toLowerCase())) {
      const updated = [...clipTags, normalised]
      setClipTags(updated)
      persistClipTags(playId, updated)
    }
    setTagSearch("")
  }

  const removeTag = (tag: string) => {
    const updated = clipTags.filter((t) => t !== tag)
    setClipTags(updated)
    persistClipTags(playId, updated)
  }

  const handleSubmitNote = () => {
    if (!noteText.trim()) return
    const newNote: ClipNote = {
      id: generateNoteId(),
      text: noteText.trim(),
      authorName: DEFAULT_USER.name,
      authorAvatar: DEFAULT_USER.avatar,
      timestamp: Date.now(),
    }
    const updated = [...notes, newNote]
    setNotes(updated)
    persistClipNotes(playId, updated)
    setNoteText("")
  }

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId)
    setNotes(updated)
    persistClipNotes(playId, updated)
  }

  const handleStartEdit = (note: ClipNote) => {
    setEditingNoteId(note.id)
    setEditingNoteText(note.text)
  }

  const handleSaveEdit = () => {
    if (!editingNoteId || !editingNoteText.trim()) return
    const updated = notes.map((n) =>
      n.id === editingNoteId ? { ...n, text: editingNoteText.trim() } : n
    )
    setNotes(updated)
    persistClipNotes(playId, updated)
    setEditingNoteId(null)
    setEditingNoteText("")
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingNoteText("")
  }

  return (
    <div className="px-4 pt-4 pb-6 flex flex-col gap-5">
      {/* Privacy notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="information" className="w-4 h-4 shrink-0" />
        <span>Only your organization can see these</span>
      </div>

      {/* TAGS */}
      <div>
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Tags</h4>

        {/* Selected tags */}
        {clipTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {clipTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove tag ${tag}`}
                >
                  <Icon name="close" className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown */}
        <div ref={tagDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setTagDropdownOpen(!tagDropdownOpen)
              setTimeout(() => tagInputRef.current?.focus(), 0)
            }}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:border-ring transition-colors text-left"
          >
            <span className="text-muted-foreground">{clipTags.length > 0 ? `${clipTags.length} tag${clipTags.length > 1 ? "s" : ""} selected` : "Select or create tags"}</span>
            <Icon name="chevronDown" className={cn("w-4 h-4 text-muted-foreground transition-transform", tagDropdownOpen && "rotate-180")} />
          </button>

          {tagDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-md">
              <div className="p-2 border-b border-border">
                <input
                  ref={tagInputRef}
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreateNew) {
                      addTag(tagSearch)
                    } else if (e.key === "Enter" && filteredTags.length > 0) {
                      const firstUnselected = filteredTags.find((t) => !clipTags.includes(t))
                      if (firstUnselected) addTag(firstUnselected)
                    }
                  }}
                  placeholder="Search or type to create..."
                  className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="max-h-48 overflow-y-auto p-1">
                {filteredTags.map((tag) => {
                  const isSelected = clipTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => (isSelected ? removeTag(tag) : addTag(tag))}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left transition-colors",
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon name="tag" className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tag}</span>
                      {isSelected && <Icon name="close" className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  )
                })}

                {canCreateNew && (
                  <button
                    onClick={() => addTag(tagSearch)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left text-primary hover:bg-muted transition-colors"
                  >
                    <Icon name="add" className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Create &ldquo;{tagSearch.trim()}&rdquo;
                    </span>
                  </button>
                )}

                {filteredTags.length === 0 && !canCreateNew && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No tags yet. Type to create one.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NOTES */}
      <div>
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Notes</h4>

        {/* Previous notes */}
        {notes.length > 0 && (
          <div className="flex flex-col divide-y divide-border mb-3">
            {notes.map((note) => {
              const isEditing = editingNoteId === note.id
              const isOwnNote = note.authorName === DEFAULT_USER.name

              return (
                <div key={note.id} className="py-4 first:pt-2 group">
                  <div className="flex items-start gap-3">
                    <img
                      src={note.authorAvatar}
                      alt={note.authorName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-accent-foreground leading-tight">{note.authorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(note.timestamp)}</p>
                    </div>
                    {isOwnNote && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Edit note"
                        >
                          <Icon name="edit" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete note"
                        >
                          <Icon name="delete" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2 ml-12">
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSaveEdit()
                          }
                          if (e.key === "Escape") {
                            handleCancelEdit()
                          }
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-ring bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editingNoteText.trim()}
                          className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs font-semibold rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground mt-2 ml-12">{note.text}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Note input */}
        <div className="relative">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmitNote()
              }
            }}
            placeholder="Write a note..."
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className={cn(
              "absolute bottom-3 right-3 transition-colors",
              noteText.trim() ? "text-primary hover:text-primary/80" : "text-muted-foreground/40"
            )}
            aria-label="Submit note"
          >
            <Icon name="send" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GamePreview Component
// ---------------------------------------------------------------------------

interface GamePreviewProps {
  game: Game
  onClose: () => void
  onNavigateToTeam?: (team: Team) => void
  onNavigateToGame?: (game: Game) => void
  onNavigateToClip?: (play: PlayData) => void
  hideHeader?: boolean
  }
  
function GamePreview({ game, onClose, onNavigateToTeam, onNavigateToGame, onNavigateToClip, hideHeader }: GamePreviewProps) {
  const router = useRouter()
  const homeTeam = findTeamById(game.homeTeamId)
  const awayTeam = findTeamById(game.awayTeamId)
  
  // Get clips for this game
  const gameClips = useMemo(() => {
  return mockClips.filter((clip) => clip.gameId === game.id)
  }, [game.id])

  // Format game date
  const formattedDate = useMemo(() => {
    const date = new Date(game.date)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [game.date])

// Handle View Full Game action - uses onNavigateToGame callback if provided
  const handleViewFullGame = useCallback(() => {
  if (onNavigateToGame) {
    onNavigateToGame(game)
  } else {
    router.push("/watch")
  }
  }, [router, onNavigateToGame, game])

  // Handle Download action
  const handleDownload = useCallback(() => {
    // Placeholder for download functionality
    console.log("Download game:", game.id)
  }, [game.id])

  // Determine winner
  const homeWon = game.score && game.score.home > game.score.away
  const awayWon = game.score && game.score.away > game.score.home

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Fixed Header - hidden when using breadcrumb wrapper */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="play" className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold truncate">{game.matchupDisplay}</span>
            <span className="text-muted-foreground text-sm shrink-0">|</span>
            <span className="text-sm text-muted-foreground truncate">
              {game.gameType === "playoff" ? "Playoff" : `Week ${game.week}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="close" className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Game Card */}
        <div className="px-4 pt-4">
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            {/* Teams & Score */}
            <div className="flex items-center justify-between gap-4">
              {/* Away Team */}
              <div 
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => awayTeam && onNavigateToTeam?.(awayTeam)}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: awayTeam?.logoColor || "#666" }}
                >
                  {awayTeam?.abbreviation || "AWY"}
                </div>
                <span className={cn(
                  "text-sm text-center",
                  awayWon ? "font-bold text-foreground" : "text-muted-foreground"
                )}>
                  {awayTeam?.name || "Away Team"}
                </span>
                {game.score && (
                  <span className={cn(
                    "text-2xl tabular-nums",
                    awayWon ? "font-bold text-foreground" : "text-muted-foreground"
                  )}>
                    {game.score.away}
                  </span>
                )}
              </div>

              {/* VS / Score Divider */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {game.status === "final" ? "Final" : "VS"}
                </span>
              </div>

              {/* Home Team */}
              <div 
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => homeTeam && onNavigateToTeam?.(homeTeam)}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: homeTeam?.logoColor || "#666" }}
                >
                  {homeTeam?.abbreviation || "HME"}
                </div>
                <span className={cn(
                  "text-sm text-center",
                  homeWon ? "font-bold text-foreground" : "text-muted-foreground"
                )}>
                  {homeTeam?.name || "Home Team"}
                </span>
                {game.score && (
                  <span className={cn(
                    "text-2xl tabular-nums",
                    homeWon ? "font-bold text-foreground" : "text-muted-foreground"
                  )}>
                    {game.score.home}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="px-4 pt-5 pb-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Game Details</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{formattedDate}</span>
            </div>
            {game.kickoffTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kickoff</span>
                <span className="text-foreground">{game.kickoffTime}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Venue</span>
              <span className="text-foreground">{game.venue}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Location</span>
              <span className="text-foreground">{game.city}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Season</span>
              <span className="text-foreground">{game.season}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">League</span>
              <span className="text-foreground">
                {game.league === "HighSchool" ? "High School" : game.league}
              </span>
            </div>
            {game.broadcast && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Broadcast</span>
                <span className="text-foreground">{game.broadcast.network}</span>
              </div>
            )}
            {game.attendance && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Attendance</span>
                <span className="text-foreground">{game.attendance.toLocaleString()}</span>
              </div>
            )}
            {game.weather && game.weather.condition !== "dome" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weather</span>
                <span className="text-foreground capitalize">
                  {game.weather.temperature}°F, {game.weather.condition}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quarter Scores (if available) */}
        {game.score?.quarters && (
          <div className="px-4 pt-4 pb-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quarter Scores</h4>
            <div className="bg-muted/30 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-2 px-3 text-left text-muted-foreground font-medium">Team</th>
                    <th className="py-2 px-2 text-center text-muted-foreground font-medium">Q1</th>
                    <th className="py-2 px-2 text-center text-muted-foreground font-medium">Q2</th>
                    <th className="py-2 px-2 text-center text-muted-foreground font-medium">Q3</th>
                    <th className="py-2 px-2 text-center text-muted-foreground font-medium">Q4</th>
                    {game.score.quarters.ot && (
                      <th className="py-2 px-2 text-center text-muted-foreground font-medium">OT</th>
                    )}
                    <th className="py-2 px-3 text-center font-bold text-foreground">T</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className={cn("py-2 px-3", awayWon && "font-bold")}>{awayTeam?.abbreviation}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q1.away}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q2.away}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q3.away}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q4.away}</td>
                    {game.score.quarters.ot && (
                      <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.ot.away}</td>
                    )}
                    <td className={cn("py-2 px-3 text-center tabular-nums", awayWon && "font-bold")}>
                      {game.score.away}
                    </td>
                  </tr>
                  <tr>
                    <td className={cn("py-2 px-3", homeWon && "font-bold")}>{homeTeam?.abbreviation}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q1.home}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q2.home}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q3.home}</td>
                    <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.q4.home}</td>
                    {game.score.quarters.ot && (
                      <td className="py-2 px-2 text-center tabular-nums">{game.score.quarters.ot.home}</td>
                    )}
                    <td className={cn("py-2 px-3 text-center tabular-nums", homeWon && "font-bold")}>
                      {game.score.home}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clips in this game */}
        <div className="px-4 pt-4 pb-6">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Clips ({gameClips.length})
          </h4>
          {gameClips.length > 0 ? (
            <div className="space-y-2">
              {gameClips.slice(0, 5).map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToClip?.(clipToPlayData(clip))}
                >
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="play" className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{clip.matchup}</p>
                    <p className="text-xs text-muted-foreground">
                      Q{clip.quarter} • {clip.down && `${clip.down}${clip.down === 1 ? "st" : clip.down === 2 ? "nd" : clip.down === 3 ? "rd" : "th"} & ${clip.distance}`}
                    </p>
                  </div>
                </div>
              ))}
              {gameClips.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{gameClips.length - 5} more clips
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No clips available for this game.</p>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          className="flex-1 font-semibold"
          onClick={handleDownload}
        >
          <Icon name="download" className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          className="flex-1 font-semibold"
          onClick={handleViewFullGame}
        >
          View Full Game
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamPreview (Team Snapshot in Preview Module)
// ---------------------------------------------------------------------------

interface TeamPreviewProps {
  team: Team
  onClose: () => void
  onNavigateToAthlete?: (athlete: Athlete & { id?: string }) => void
  onNavigateToGame?: (game: Game) => void
  hideHeader?: boolean
}

/** Look up team's league, conference, and division from sports data */
function getTeamLeagueInfo(teamId: string): { league: string; conference: string; division: string } {
  // Import inline to avoid circular deps
  const { sportsData } = require("@/lib/sports-data")
  
  // Check NFL
  for (const conf of sportsData.NFL.conferences) {
    if (conf.subdivisions) {
      for (const div of conf.subdivisions) {
        if (div.teams.some((t: { id: string }) => t.id === teamId)) {
          return { league: "NFL", conference: conf.name, division: div.name }
        }
      }
    }
  }
  
  // Check NCAA
  for (const conf of sportsData["NCAA (FBS)"].conferences) {
    if (conf.teams.some((t: { id: string }) => t.id === teamId)) {
      return { league: "NCAA", conference: conf.name, division: conf.name }
    }
  }
  
  // Check High School
  for (const conf of sportsData.HighSchool.conferences) {
    if (conf.teams.some((t: { id: string }) => t.id === teamId)) {
      return { league: "High School", conference: conf.name, division: conf.name }
    }
  }
  
  // Fallback based on ID pattern
  if (teamId.startsWith("hs-")) {
    return { league: "High School", conference: "Regional", division: "Varsity" }
  } else if (teamId.length > 3) {
    return { league: "NCAA", conference: "FBS", division: "Division I" }
  }
  return { league: "NFL", conference: "AFC", division: "AFC East" }
}

/** Generate deterministic mock team identity data based on team ID */
function generateTeamIdentityData(teamId: string) {
  const h = hashString(teamId)
  const firstNames = ["Mike", "John", "Bill", "Nick", "Andy", "Sean", "Kyle", "Dan", "Kevin", "Matt"]
  const lastNames = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Davis", "Wilson", "Thomas", "Moore", "Taylor"]
  const cities = ["Pittsburgh, PA", "Dallas, TX", "Miami, FL", "Chicago, IL", "New York, NY", "Denver, CO", "Seattle, WA", "Phoenix, AZ", "Atlanta, GA", "Detroit, MI", "Los Angeles, CA", "San Francisco, CA", "Boston, MA", "Philadelphia, PA"]
  const stadiumPrefixes = ["Memorial", "Victory", "Heritage", "National", "United", "State", "Metro", "Central", "University", "Civic"]
  const stadiumSuffixes = ["Stadium", "Field", "Arena", "Bowl", "Coliseum", "Field House", "Center"]
  
  return {
    headCoach: `${firstNames[h % firstNames.length]} ${lastNames[(h + 3) % lastNames.length]}`,
    location: cities[h % cities.length],
    homeArena: `${stadiumPrefixes[h % stadiumPrefixes.length]} ${stadiumSuffixes[(h + 2) % stadiumSuffixes.length]}`,
  }
}

/** Generate deterministic mock team stats based on team ID */
function generateTeamStats(teamId: string) {
  const h = hashString(teamId)
  return {
    pointsFor: 200 + (h % 150),
    pointsAgainst: 180 + ((h + 7) % 140),
    offenseRank: 1 + (h % 20),
    defenseRank: 1 + ((h + 13) % 20),
    passingYPG: 200 + (h % 120),
    rushingYPG: 80 + ((h + 5) % 80),
    record: {
      wins: 6 + (h % 8),
      losses: 3 + ((h + 3) % 7),
    },
  }
}

function TeamPreview({ team, onClose, onNavigateToAthlete, onNavigateToGame, hideHeader }: TeamPreviewProps) {
  const router = useRouter()

  // Get team stats (deterministic mock data)
  const stats = useMemo(() => generateTeamStats(team.id), [team.id])

  // Get athletes for this team
  const teamAthletes = useMemo(() => getAthletesForTeam(team.id), [team.id])

  // Get key players (top 4 by position priority: QB, RB, WR, DE/LB)
  const keyPlayers = useMemo(() => {
    const positionPriority = ["QB", "RB", "WR", "TE", "DE", "LB", "CB", "S"]
    const sorted = [...teamAthletes].sort((a, b) => {
      const aIdx = positionPriority.indexOf(a.position)
      const bIdx = positionPriority.indexOf(b.position)
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
    return sorted.slice(0, 4).map((athlete) => {
      // Generate a mock stat based on position
      const h = hashString(athlete.id || athlete.name)
      let statLabel = ""
      let statValue = ""
      if (athlete.position === "QB") {
        statValue = `${2500 + (h % 1500)}`
        statLabel = "YDS"
      } else if (athlete.position === "RB") {
        statValue = `${600 + (h % 700)}`
        statLabel = "YDS"
      } else if (athlete.position === "WR" || athlete.position === "TE") {
        statValue = `${400 + (h % 800)}`
        statLabel = "YDS"
      } else if (athlete.position === "DE" || athlete.position === "DT") {
        statValue = `${4 + (h % 10)}`
        statLabel = "SACKS"
      } else {
        statValue = `${40 + (h % 80)}`
        statLabel = "TKL"
      }
      return { ...athlete, statValue, statLabel }
    })
  }, [teamAthletes])

  // Get recent games for this team (up to 3)
  const recentGames = useMemo(() => {
    return mockGames
      .filter((g) => g.homeTeamId === team.id || g.awayTeamId === team.id)
      .filter((g) => g.status === "final" && g.score)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((game) => {
        const isHome = game.homeTeamId === team.id
        const teamScore = isHome ? game.score!.home : game.score!.away
        const opponentScore = isHome ? game.score!.away : game.score!.home
        const opponentId = isHome ? game.awayTeamId : game.homeTeamId
        const opponent = findTeamById(opponentId)
        const won = teamScore > opponentScore
        return {
          id: game.id,
          gameData: game, // Include full game object for navigation
          opponent: opponent?.name || "Unknown",
          opponentAbbr: opponent?.abbreviation || "UNK",
          teamScore,
          opponentScore,
          won,
          week: game.week,
        }
      })
  }, [team.id])

  // Calculate PPG values
  const gamesPlayed = stats.record.wins + stats.record.losses
  const ppgFor = gamesPlayed > 0 ? (stats.pointsFor / gamesPlayed).toFixed(1) : "0.0"
  const ppgAgainst = gamesPlayed > 0 ? (stats.pointsAgainst / gamesPlayed).toFixed(1) : "0.0"

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Fixed Header - hidden when using breadcrumb wrapper */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: team.logoColor }}
            >
              {team.abbreviation}
            </div>
            <span className="text-sm font-bold truncate">{team.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="close" className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Team Identity Card - matching Athlete pattern */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: team.logoColor }}
          >
            {team.abbreviation}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight truncate">{team.name}</h2>
            {(() => {
              const leagueInfo = getTeamLeagueInfo(team.id)
              return (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 flex-wrap">
                  <span>{leagueInfo.league}</span>
                  <span className="text-border">{"·"}</span>
                  <span>{leagueInfo.conference}</span>
                  <span className="text-border">{"·"}</span>
                  <span>{leagueInfo.division}</span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Identity Section */}
        <div className="px-5 pb-4">
          <h3 className="text-lg font-bold text-foreground mb-3">Identity</h3>
          <div className="flex flex-col">
            {(() => {
              const identityData = generateTeamIdentityData(team.id)
              const leagueInfo = getTeamLeagueInfo(team.id)
              return (
                <>
                  <IdentityRow label="Team Name" value={team.name} />
                  <IdentityRow label="Head Coach" value={identityData.headCoach} onClick={() => {}} />
                  <IdentityRow label="Conference" value={leagueInfo.conference} onClick={() => {}} />
                  <IdentityRow label="Location" value={identityData.location} />
                  <IdentityRow label="Home Arena" value={identityData.homeArena} isLast />
                </>
              )
            })()}
          </div>
        </div>

        {/* Team Stats Section */}
        <div className="px-5 pt-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Team Stats</h4>
          <div className="grid grid-cols-2 gap-2">
            {/* Points For */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Points For</p>
              <p className="text-xl font-bold text-foreground">{stats.pointsFor}</p>
              <p className="text-xs text-muted-foreground">{ppgFor} PPG</p>
            </div>
            {/* Points Against */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Points Against</p>
              <p className="text-xl font-bold text-foreground">{stats.pointsAgainst}</p>
              <p className="text-xs text-muted-foreground">{ppgAgainst} PPG</p>
            </div>
            {/* Offense Rank */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Offense Rank</p>
              <p className="text-xl font-bold text-foreground">#{stats.offenseRank}</p>
            </div>
            {/* Defense Rank */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Defense Rank</p>
              <p className="text-xl font-bold text-foreground">#{stats.defenseRank}</p>
            </div>
            {/* Passing */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Passing</p>
              <p className="text-xl font-bold text-foreground">{stats.passingYPG}</p>
              <p className="text-xs text-muted-foreground">YDS/Game</p>
            </div>
            {/* Rushing */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rushing</p>
              <p className="text-xl font-bold text-foreground">{stats.rushingYPG}</p>
              <p className="text-xs text-muted-foreground">YDS/Game</p>
            </div>
          </div>
        </div>

        {/* Key Players Section */}
        {keyPlayers.length > 0 && (
          <div className="px-4 pt-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Key Players</h4>
            <div className="space-y-2">
              {keyPlayers.map((player, idx) => (
                <div
                  key={player.id || idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToAthlete?.(player)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {player.jersey_number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.position}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {player.statValue} {player.statLabel}
                    </span>
                    <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Games Section */}
        {recentGames.length > 0 && (
          <div className="px-4 pt-5 pb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Games</h4>
            <div className="space-y-2">
              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToGame?.(game.gameData)}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0",
                      game.won
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "bg-red-500/20 text-red-500"
                    )}
                  >
                    {game.won ? "W" : "L"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      vs {game.opponentAbbr}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {game.teamScore}-{game.opponentScore}
                    </span>
                    <span className="text-xs text-muted-foreground">Week {game.week}</span>
                    <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          className="flex-1 font-semibold"
          onClick={() => {
            // Placeholder for viewing team schedule
            console.log("View schedule:", team.id)
          }}
        >
          View Schedule
        </Button>
        <Button
          className="flex-1 font-semibold"
          onClick={() => router.push(`/teams/${team.id}`)}
        >
          View Full Profile
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AthletePreview (Athlete Profile in Preview Module - standalone)
// ---------------------------------------------------------------------------

interface AthletePreviewProps {
  athlete: Athlete & { id?: string }
  onClose: () => void
  hideHeader?: boolean
  onNavigateToTeam?: (team: Team) => void
}

function AthletePreview({ athlete, onClose, hideHeader, onNavigateToTeam }: AthletePreviewProps) {
  const [profileTab, setProfileTab] = useState<typeof PROFILE_TABS[number]>("Overview")
  const keyStats = useMemo(() => getKeyStatsForAthlete(athlete), [athlete])
  const teamName = TEAM_FULL_NAMES[athlete.team] || athlete.team
  const athleteTeam = useMemo(() => findTeamById(athlete.team), [athlete.team])
  const router = useRouter()

  // Generate athlete slug for the full profile link
  const athleteSlug = athlete.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Header with close button - hidden when using breadcrumb wrapper */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <span className="text-sm font-semibold text-foreground truncate">Player Profile</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="close" className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Avatar + Name + Team/Position - matching Figma design */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground shrink-0">
            {athlete.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight truncate">{athlete.name}</h2>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {athleteTeam && (
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: athleteTeam.logoColor }}
                >
                  {athleteTeam.abbreviation.slice(0, 2)}
                </div>
              )}
              {athleteTeam && onNavigateToTeam ? (
                <button
                  onClick={() => onNavigateToTeam(athleteTeam)}
                  className="text-foreground underline cursor-pointer"
                >
                  {teamName}
                </button>
              ) : (
                <span>{teamName}</span>
              )}
              <span className="text-border">{"·"}</span>
              <span>{athlete.position}</span>
              <span className="text-border">{"·"}</span>
              <span>#{athlete.jersey_number}</span>
            </div>
          </div>
        </div>

        {/* Profile tabs */}
        <div className="px-5 pb-4 flex items-center gap-1.5 overflow-x-auto">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setProfileTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                profileTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {profileTab === "Overview" ? (
          <div className="px-5 pb-6">
            {/* Identity section */}
            <h3 className="text-lg font-bold text-foreground mb-3">Identity</h3>
            <div className="flex flex-col">
<IdentityRow label="Height / Weight" value={`${athlete.height} / ${athlete.weight} lbs`} />
  <IdentityRow label="Position" value={athlete.position} />
  <IdentityRow label="Jersey" value={`#${athlete.jersey_number}`} />
  <IdentityRow label="College" value={athlete.college} />
  <IdentityRow 
    label="Team" 
    value={teamName} 
    isLast 
    onClick={athleteTeam && onNavigateToTeam ? () => onNavigateToTeam(athleteTeam) : undefined}
  />
  </div>
  
  {/* Key Stats */}
  <div className="mt-8">
  <div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-bold text-foreground">Key Stats</h3>
  <span className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-2.5 py-1">
  2025/26
  </span>
  </div>
  <div className="grid grid-cols-2 gap-3">
  {keyStats.map((stat) => (
  <div key={stat.label} className="rounded-lg border border-border p-3">
  <p className="text-xs font-bold text-primary mb-1">{stat.label}</p>
  <div className="flex items-baseline gap-1">
  <span className="text-2xl font-extrabold text-foreground italic">{stat.value}</span>
  {stat.secondary && (
  <span className="text-xs text-muted-foreground">{stat.secondary}</span>
  )}
  </div>
  {stat.note && (
  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.note}</p>
  )}
  </div>
  ))}
  </div>
  </div>
  </div>
  ) : (
  <div className="px-5 py-10 text-center text-sm text-muted-foreground">
  {profileTab} content coming soon.
  </div>
  )}
  </div>

  {/* Fixed Footer */}
  <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
  <Button
  variant="outline"
  className="flex-1 font-semibold"
  onClick={() => {
  // Placeholder for viewing athlete highlights
  console.log("View highlights:", athlete.name)
  }}
  >
  View Highlights
  </Button>
  <Button
  className="flex-1 font-semibold"
  onClick={() => router.push(`/athletes/${athleteSlug}`)}
  >
  View Full Profile
  </Button>
  </div>
  </div>
  )
  }

// ---------------------------------------------------------------------------
// PreviewModule
// ---------------------------------------------------------------------------

interface PreviewModuleProps {
  play?: PlayData
  game?: Game
  team?: Team
  athlete?: Athlete & { id?: string }
  onClose: () => void
  // Navigation callbacks for breadcrumb support
  onNavigateToTeam?: (team: Team) => void
  onNavigateToAthlete?: (athlete: Athlete & { id?: string }) => void
  onNavigateToGame?: (game: Game) => void
  onNavigateToClip?: (play: PlayData) => void
  // Hide the internal header (used when wrapped by breadcrumb navigation)
  hideHeader?: boolean
}

export function PreviewModule({ 
  play, 
  game, 
  team, 
  athlete, 
  onClose,
  onNavigateToTeam,
  onNavigateToAthlete,
  onNavigateToGame,
  onNavigateToClip,
  hideHeader,
}: PreviewModuleProps) {
  // If athlete is provided, render AthletePreview
  if (athlete) {
    return <AthletePreview athlete={athlete} onClose={onClose} hideHeader={hideHeader} onNavigateToTeam={onNavigateToTeam} />
  }

  // If team is provided, render TeamPreview
  if (team) {
    return <TeamPreview team={team} onClose={onClose} onNavigateToAthlete={onNavigateToAthlete} onNavigateToGame={onNavigateToGame} hideHeader={hideHeader} />
  }

// If game is provided, render GamePreview
  if (game) {
  return <GamePreview game={game} onClose={onClose} onNavigateToTeam={onNavigateToTeam} onNavigateToGame={onNavigateToGame} onNavigateToClip={onNavigateToClip} hideHeader={hideHeader} />
  }

  // Otherwise render the clip preview (need a play)
  if (!play) {
    return null
  }

  const videoUrl = useMemo(() => getVideoForPlay(play), [play])
  const summary = useMemo(() => generatePlaySummary(play), [play])
  const roster = useMemo(() => assignPlayRoster(play), [play])
  const sourceType = useMemo(() => getSourceType(play), [play])
  const score = useMemo(() => getGameScore(play), [play])

  const [activeTab, setActiveTab] = useState<"info" | "tags-notes">("info")
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)

  const { setPendingPreviewClips, setWatchItem } = useLibraryContext()
  const router = useRouter()

  // Reset athlete view when play changes
  useEffect(() => {
    setSelectedAthlete(null)
  }, [play])

  const handlePlayerClick = useCallback((playerName: string) => {
  const athlete = getAthleteByName(playerName)
  if (athlete) {
    // If breadcrumb navigation is available, use it instead of internal state
    if (onNavigateToAthlete) {
      onNavigateToAthlete(athlete)
      return
    }
    setSelectedAthlete(athlete)
    return
  }
  // Fallback for hardcoded roster players (OL / extra DL) not in athletes-data
  const rosterPlayer = [...OL_PLAYERS, ...EXTRA_DL].find((p) => p.name === playerName)
  if (rosterPlayer) {
    const synthetic: Athlete & { id: string } = {
      id: `synthetic-${rosterPlayer.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: rosterPlayer.name,
      team: "DET",
      position: rosterPlayer.position as Athlete["position"],
      jersey_number: rosterPlayer.jersey_number,
      height: "6'3",
      weight: 305,
      college: "N/A",
      stats: { passing_yards: 0, passing_tds: 0, rushing_yards: 0, rushing_tds: 0, receiving_yards: 0, receiving_tds: 0, tackles: 0, sacks: 0 },
    }
    if (onNavigateToAthlete) {
      onNavigateToAthlete(synthetic)
      return
    }
    setSelectedAthlete(synthetic)
  }
  }, [onNavigateToAthlete])

  // "Open Clip" -- open as unsaved playlist in watch page
  const handleOpenClip = useCallback(() => {
    const clip = playToClip(play)
    setPendingPreviewClips([clip])
    router.push("/watch")
  }, [play, setPendingPreviewClips, router])

  // "View Full Game" -- open the Library Item the clip references
  const handleViewFullGame = useCallback(() => {
    // Identify a library item by matching the game string
    // For now we use a hash of the game name as a deterministic item id
    setWatchItem(null)
    router.push("/watch")
  }, [setWatchItem, router])

// If an athlete is selected, show their profile instead of the clip view
  if (selectedAthlete) {
  return <AthleteProfileView athlete={selectedAthlete} onBack={() => setSelectedAthlete(null)} onNavigateToTeam={onNavigateToTeam} />
  }

  return (
    <div className="h-full flex flex-col bg-background rounded-lg overflow-hidden relative">
      {/* Fixed Header - hidden when using breadcrumb wrapper */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="play" className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-bold truncate">Clip {play.playNumber}</span>
            <span className="text-muted-foreground text-sm shrink-0">|</span>
            <span className="text-sm text-muted-foreground truncate">{formatGameLabel(play.game)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Icon name="close" className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Video Player */}
        <div className="px-4 pt-4">
          <PreviewVideoPlayer
            videoUrl={videoUrl}
            sourceType={sourceType}
            score={score}
            onOpenClip={handleOpenClip}
          />
        </div>

        {/* Tabs */}
        <div className="px-4 pt-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("info")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              activeTab === "info"
                ? "bg-accent-foreground text-background"
                : "bg-transparent text-muted-foreground border border-border hover:bg-muted"
            )}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab("tags-notes")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              activeTab === "tags-notes"
                ? "bg-accent-foreground text-background"
                : "bg-transparent text-muted-foreground border border-border hover:bg-muted"
            )}
          >
            {"Tags & Notes"}
          </button>
        </div>

        {activeTab === "info" ? (
          <>
            {/* Play Summary */}
            <div className="px-4 pt-5 pb-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Play Summary</h4>
              <p className="text-sm leading-relaxed text-foreground">{summary}</p>
            </div>

            {/* Offense on the field */}
            <div className="px-4 pt-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Offense on the Field</h4>
              <div className="flex flex-wrap gap-1.5">
                {roster.offense.map((player, i) => (
                  <PlayerChip key={`off-${i}`} player={player} onClick={() => handlePlayerClick(player.name)} />
                ))}
              </div>
            </div>

            {/* Defense on the field */}
            <div className="px-4 pt-5 pb-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Defense on the Field</h4>
              <div className="flex flex-wrap gap-1.5">
                {roster.defense.map((player, i) => (
                  <PlayerChip key={`def-${i}`} player={player} onClick={() => handlePlayerClick(player.name)} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <TagsAndNotesTab playId={play.id} />
        )}
      </div>

      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <AddToPlaylistButton play={play} />
        <Button
          variant="outline"
          className="flex-1 font-semibold"
          onClick={handleViewFullGame}
        >
          View Full Game
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add to Playlist button (for preview footer)
// ---------------------------------------------------------------------------

function AddToPlaylistButton({ play }: { play: PlayData }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { folders, rootItems, recentPlaylists, addToPlaylist, mediaItems, addClipsToPlaylist, openCreatePlaylistModal, setWatchItem } = useLibraryContext()
  const { toast } = useToast()
  const router = useRouter()

  const allPlaylists = useMemo(() => {
    const playlists: Array<{ id: string; name: string; folderId: string | null }> = []
    rootItems.forEach((item) => {
      if (item.type === "playlist") {
        playlists.push({ id: item.id, name: item.name, folderId: null })
      }
    })
    const findPlaylists = (nodes: any[], _parentId: string | null) => {
      nodes.forEach((node) => {
        if (node.items) {
          node.items.forEach((item: any) => {
            if (item.type === "playlist") {
              playlists.push({ id: item.id, name: item.name, folderId: node.id })
            }
          })
        }
        if (node.children) {
          findPlaylists(node.children, node.id)
        }
      })
    }
    findPlaylists(folders, null)
    mediaItems.forEach((mi) => {
      if (mi.type === "playlist" && !playlists.some((p) => p.id === mi.id)) {
        playlists.push({ id: mi.id, name: mi.name, folderId: mi.parentId })
      }
    })
    return playlists
  }, [folders, rootItems, mediaItems])

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return allPlaylists
    const query = searchQuery.toLowerCase()
    return allPlaylists.filter((p) => p.name.toLowerCase().includes(query))
  }, [allPlaylists, searchQuery])

  const handleAddToPlaylist = (playlistId: string) => {
    const clip = playToClip(play)
    addClipsToPlaylist(playlistId, [clip])
    addToPlaylist(playlistId, [clip.id])

    toast({
      description: "1 clip added to playlist.",
      action: (
        <ToastAction
          altText="View Playlist"
          onClick={() => {
            setWatchItem(playlistId)
            router.push("/watch")
          }}
          className="h-7 px-2 text-xs"
        >
          View Playlist
        </ToastAction>
      ),
    })

    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="flex-1 font-semibold">
          Add to Playlist
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="top">
        <div className="p-3 border-b border-border">
          <input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {recentPlaylists.length > 0 && !searchQuery && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">Recent</div>
              {recentPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
                >
                  <Icon name="playlist" className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{playlist.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="p-2">
            {!searchQuery && recentPlaylists.length > 0 && (
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">All Playlists</div>
            )}
            {filteredPlaylists.length > 0 ? (
              filteredPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left"
                >
                  <Icon name="playlist" className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{playlist.name}</span>
                </button>
              ))
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                {searchQuery ? "No playlists found" : "No playlists available"}
              </div>
            )}
          </div>
        </div>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => {
              const clip = playToClip(play)
              setOpen(false)
              setSearchQuery("")
              openCreatePlaylistModal(undefined, [clip])
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left text-primary"
          >
            <Icon name="add" className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Import toast
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
