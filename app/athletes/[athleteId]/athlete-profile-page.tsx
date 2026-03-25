"use client"

import { useEffect } from "react"
import { ProfileView } from "@/components/profile/profile-view"
import { useBreadcrumbContextOptional } from "@/lib/breadcrumb-context"
import { nameToSlug } from "@/lib/athletes-data"
import type { Athlete } from "@/types/athlete"

interface AthleteProfilePageProps {
  athlete: Athlete
}

export function AthleteProfilePage({ athlete }: AthleteProfilePageProps) {
  const breadcrumbContext = useBreadcrumbContextOptional()
  
  // Generate slug for routing
  const athleteSlug = nameToSlug(athlete.name)

  // Push athlete anchor to breadcrumbs when the page loads
  useEffect(() => {
    if (!breadcrumbContext || !breadcrumbContext.isHydrated) {
      return
    }
    
    // Check if this athlete is already in the breadcrumbs (prevents duplicates on re-renders)
    const alreadyInBreadcrumbs = breadcrumbContext.breadcrumbs.some(
      b => b.specificType === "athlete" && b.id === athleteSlug
    )
    
    if (alreadyInBreadcrumbs) {
      return
    }
    
    // If no collection anchor exists (direct navigation), set up "Athletes" as the starting point
    if (breadcrumbContext.breadcrumbs.length === 0) {
      breadcrumbContext.setCollectionAnchor("athletes")
    }
    
    breadcrumbContext.pushAnchor({
      anchorType: "entity",
      specificType: "athlete",
      label: athlete.name,
      id: athleteSlug,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteSlug, breadcrumbContext?.isHydrated])

  // Create athlete with id for ProfileView
  const athleteWithId = {
    ...athlete,
    id: athlete.id || athleteSlug,
  }

  return (
    <div className="h-full w-full p-3">
      <ProfileView 
        athlete={athleteWithId}
        onClose={() => {
          // Navigate back when closing - handled by breadcrumbs
          window.history.back()
        }}
      />
    </div>
  )
}
