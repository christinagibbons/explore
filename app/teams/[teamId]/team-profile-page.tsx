"use client"

import { useEffect } from "react"
import { TeamProfileView } from "@/components/profile/team-profile-view"
import { useBreadcrumbContextOptional } from "@/lib/breadcrumb-context"
import type { Team } from "@/lib/sports-data"

interface TeamProfilePageProps {
  team: Team
}

export function TeamProfilePage({ team }: TeamProfilePageProps) {
  const breadcrumbContext = useBreadcrumbContextOptional()

  // Push team anchor to breadcrumbs when the page loads
  useEffect(() => {
    if (!breadcrumbContext || !breadcrumbContext.isHydrated) {
      return
    }
    
    // Check if this team is already in the breadcrumbs (prevents duplicates on re-renders)
    const alreadyInBreadcrumbs = breadcrumbContext.breadcrumbs.some(
      b => b.specificType === "team" && b.id === team.id
    )
    
    if (alreadyInBreadcrumbs) {
      return
    }
    
    // If no collection anchor exists (direct navigation), set up "Teams" as the starting point
    if (breadcrumbContext.breadcrumbs.length === 0) {
      breadcrumbContext.setCollectionAnchor("teams")
    }
    
    breadcrumbContext.pushAnchor({
      anchorType: "entity",
      specificType: "team",
      label: team.name,
      id: team.id,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id, breadcrumbContext?.isHydrated])

  return (
    <div className="h-full w-full p-3">
      <TeamProfileView 
        team={team}
        onClose={() => {
          // Navigate back when closing - handled by breadcrumbs
          window.history.back()
        }}
      />
    </div>
  )
}
