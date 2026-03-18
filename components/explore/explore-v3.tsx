"use client"

import { Icon } from "@/components/icon"

/**
 * V3 - Everything is a module
 * 
 * This version will treat everything as modular components.
 * Placeholder for now - customize based on specific requirements.
 */
export function ExploreV3() {
  return (
    <div className="flex flex-col h-full w-full bg-sidebar">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 bg-background rounded-lg shadow-sm max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icon name="grid" className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">V3 - Everything is a module</h2>
          <p className="text-sm text-muted-foreground">
            This version will treat all content as modular, composable components.
          </p>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Coming Soon</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Modular content blocks</li>
              <li>• Drag & drop organization</li>
              <li>• Customizable layouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
