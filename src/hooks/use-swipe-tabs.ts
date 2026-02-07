"use client";

import { useRef, useCallback } from "react";

interface UseSwipeTabsOptions {
  onSwipeLeft: () => void;  // Next tab (RTL)
  onSwipeRight: () => void; // Previous tab (RTL)
  threshold?: number;       // Minimum swipe distance (default: 50px)
  enabled?: boolean;        // Enable/disable swipe (default: true)
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeTabs({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeTabsOptions) {
  const touchState = useRef<TouchState | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      
      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // Check if horizontal swipe (not vertical scroll)
      // Horizontal movement should be greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        // Quick swipe (< 300ms) or long swipe
        if (deltaTime < 300 || Math.abs(deltaX) > threshold * 2) {
          if (deltaX > 0) {
            // Swipe right → Previous tab (RTL: visually goes right)
            onSwipeRight();
          } else {
            // Swipe left → Next tab (RTL: visually goes left)
            onSwipeLeft();
          }
        }
      }

      touchState.current = null;
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
