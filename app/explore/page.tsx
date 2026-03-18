"use client"

import { useExploreContext } from "@/lib/explore-context"
import { ExploreV1 } from "@/components/explore/explore-v1"
import { ExploreV2 } from "@/components/explore/explore-v2"
import { ExploreV3 } from "@/components/explore/explore-v3"

export default function ExplorePage() {
  const { exploreVersion } = useExploreContext()

  switch (exploreVersion) {
    case "v1":
      return <ExploreV1 />
    case "v2":
      return <ExploreV2 />
    case "v3":
      return <ExploreV3 />
    default:
      return <ExploreV1 />
  }
}
