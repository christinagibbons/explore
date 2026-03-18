"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/icon"
import { 
  Command, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { useGlobalSearch } from "@/hooks/use-global-search"
import { useLibraryContext } from "@/lib/library-context"
import { cn } from "@/lib/utils"

export function GlobalSearch() {
  const router = useRouter()
  const { query, setQuery, results } = useGlobalSearch()
  const { navigateToFolder, setWatchItem } = useLibraryContext()
  const [open, setOpen] = useState(false)

  const hasResults = results.folders.length > 0 || results.items.length > 0 || results.clips.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full flex items-center">
          <div className="absolute left-3 pointer-events-none flex items-center justify-center">
            <Icon name="search" className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search folders, files, or clips..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length > 0) setOpen(true)
            }}
            onFocus={() => {
              if (query.length > 0) setOpen(true)
            }}
            className={cn(
              "w-full h-9 pl-9 pr-3 text-sm rounded-md",
              "bg-background border border-input",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
            )}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="rounded-lg border shadow-md">
          <CommandList>
            {!hasResults && query.length > 1 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            
            {results.folders.length > 0 && (
              <CommandGroup heading="Folders">
                {results.folders.map(folder => (
                  <CommandItem
                    key={folder.id}
                    value={folder.name}
                    onSelect={() => {
                      navigateToFolder(folder.id)
                      router.push('/library')
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon name="folder" className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{folder.name}</span>
                      {folder.path && (
                        <span className="text-xs text-muted-foreground truncate">{folder.path}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.items.length > 0 && (
              <CommandGroup heading="Files">
                {results.items.map(item => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      if (item.itemData) {
                        setWatchItem(item.id)
                        router.push('/watch')
                      }
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon name="video" className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      {item.path && (
                        <span className="text-xs text-muted-foreground truncate">{item.path}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.clips.length > 0 && (
              <CommandGroup heading="Clips">
                {results.clips.map(clip => (
                  <CommandItem
                    key={clip.id}
                    value={`${clip.matchup} ${clip.down} ${clip.distance}`}
                    onSelect={() => {
                      // TODO: Implement clip playing logic properly
                      console.log("Play clip", clip.id)
                      setOpen(false)
                      setQuery("")
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon name="play" className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {clip.matchup} - Q{clip.quarter} {clip.time}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {clip.down}{clip.down === 1 ? "st" : clip.down === 2 ? "nd" : clip.down === 3 ? "rd" : "th"} & {clip.distance} | {clip.yardLine} yd line | {clip.gain > 0 ? `+${clip.gain}` : clip.gain} yds
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
