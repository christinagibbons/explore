"use client"

import type * as React from "react"
import { ChevronRight, ChevronsLeft, ChevronsRight, User, Settings, LogOut } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Icon } from "@/components/icon"
import { ModuleLibraryIcon } from "@/components/module-library-icon"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useCatapultImportContext } from "@/lib/catapult-import-context"
import { useExploreContextOptional, EXPLORE_VERSION_LABELS, type ExploreVersion } from "@/lib/explore-context"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface HudlSidebarProps {
  children?: React.ReactNode
}

function SidebarLogo() {
  const { state, toggleSidebar } = useSidebar()

  if (state === "collapsed") {
    return (
      <div className="flex justify-center">
        <Logo type="logomark" className="w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <Logo type="logomark" className="w-6 h-6" />
        <span className="text-sidebar-foreground font-semibold text-lg">Hudl</span>
      </div>
      <button
        onClick={toggleSidebar}
        className="p-1 rounded hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
        aria-label="Collapse sidebar"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
    </div>
  )
}

function CollapsedToggle() {
  const { state, toggleSidebar } = useSidebar()

  if (state !== "collapsed") return null

  return (
    <div className="flex justify-center">
      <button
        onClick={toggleSidebar}
        className="p-1 rounded hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-sidebar-foreground"
        aria-label="Expand sidebar"
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function TeamSection() {
  const { state } = useSidebar()

  if (state === "collapsed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-[#19356f] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SUN</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div>
              <div className="font-medium">Team name</div>
              <div className="text-xs text-muted-foreground">User Role</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <SidebarMenuButton className="w-full justify-between h-auto py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#19356f] rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">SUN</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-sidebar-foreground">Team name</span>
          <span className="text-xs text-muted-foreground">User Role</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </SidebarMenuButton>
  )
}

export function HudlSidebar({ children }: HudlSidebarProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { activeVersion, setActiveVersion } = useCatapultImportContext()
  const exploreContext = useExploreContextOptional()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    if (!mounted) return

    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  const bottomNavItems = [
    { name: "Settings", icon: "settings", badge: null },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r-0 border-sidebar">
      <SidebarHeader className="p-3">
        <SidebarLogo />
        <CollapsedToggle />

        {/* Team Section */}
        <div className="mt-4">
          <TeamSection />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* Main Navigation */}
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/library"} tooltip="Library">
              <Link href="/library">
                <ModuleLibraryIcon size={20} className="w-5 h-5 flex-shrink-0" />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/explore")} tooltip="Explore">
              <Link href="/explore">
                <Icon name="explore" className="w-5 h-5 flex-shrink-0" />
                <span>Explore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-3">
        <div className="border-t border-dashed border-sidebar-border my-2" />

        {/* Bottom Navigation */}
        <SidebarMenu className="gap-1">
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton tooltip={item.name}>
                <Icon name={item.icon as any} className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleThemeToggle}
              className="opacity-60 hover:opacity-100 transition-opacity"
              tooltip={mounted && resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              <Icon name={mounted && resolvedTheme === "dark" ? "sun" : "moon"} className="w-5 h-5 flex-shrink-0" />
              <span>{mounted && resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Explore Versions selector */}
          {exploreContext && (
            <SidebarMenuItem>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="Explore Versions">
                    <Icon name="explore" className="w-5 h-5 flex-shrink-0" />
                    <span>Explore Versions</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-64">
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Select Version</div>
                  {(["v1", "v2", "v3"] as ExploreVersion[]).map((version) => (
                      <DropdownMenuItem
                        key={version}
                        onClick={() => exploreContext.setExploreVersion(version)}
                        className={cn(
                          exploreContext.exploreVersion === version ? "bg-accent" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${exploreContext.exploreVersion === version ? "bg-blue-600" : "bg-muted"}`} />
                          {EXPLORE_VERSION_LABELS[version]}
                        </div>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        {/* User Profile Section */}
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="h-auto py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                  tooltip="User Name"
                >
                  <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src="/professional-headshot.png" alt="User avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">User name</span>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/components" className="flex items-center gap-2">
                    <Icon name="grid" className="w-4 h-4" />
                    Component Library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
