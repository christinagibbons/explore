"use client"

import { Icon } from "@/components/icon"

/**
 * V2 - New Contexts
 * 
 * This version will implement a new context-based navigation pattern.
 * Placeholder for now - customize based on specific requirements.
 */
export function ExploreV2() {
  return (
    <div className="flex flex-col h-full w-full bg-sidebar">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 bg-background rounded-lg shadow-sm max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="explore" className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">V2 - New Contexts</h2>
          <p className="text-sm text-muted-foreground">
            This version will implement a new context-based navigation pattern for the explore page.
          </p>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Coming Soon</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Context-aware navigation</li>
              <li>• Enhanced preview interactions</li>
              <li>• New filter patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
