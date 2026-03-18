import { notFound } from "next/navigation"
import { AthleteProfilePage } from "./athlete-profile-page"
import { athletes, nameToSlug } from "@/lib/athletes-data"

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ athleteId: string }>
}

export default async function Page({ params }: PageProps) {
  const { athleteId } = await params
  
  // Find athlete by slug
  const athlete = athletes.find((a) => nameToSlug(a.name) === athleteId.toLowerCase())

  if (!athlete) {
    notFound()
  }

  return <AthleteProfilePage athlete={athlete} />
}

// ---------------------------------------------------------------------------
// Generate static params for all athletes (optional optimization)
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return athletes.map((athlete) => ({
    athleteId: nameToSlug(athlete.name),
  }))
}
