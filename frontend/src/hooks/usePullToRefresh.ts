import { useEffect, useRef, useState } from "react";

const TRIGGER_DISTANCE = 72;
const MAX_PULL = 130;

/**
 * Touch-based pull-to-refresh: when the page is scrolled to the very top and
 * the user drags down past the trigger distance, `onRefresh` runs. Returns the
 * current pull distance and refreshing state so callers can render an indicator.
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    function updatePull(distance: number) {
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    }

    function handleTouchStart(event: TouchEvent) {
      startYRef.current = window.scrollY <= 0 && !refreshingRef.current ? event.touches[0].clientY : null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startYRef.current === null) return;
      const distance = event.touches[0].clientY - startYRef.current;
      if (distance <= 0 || window.scrollY > 0) {
        startYRef.current = null;
        updatePull(0);
        return;
      }
      event.preventDefault(); // keep the browser's native overscroll refresh from firing
      updatePull(Math.min(distance * 0.5, MAX_PULL)); // rubber-band resistance
    }

    function handleTouchEnd() {
      if (startYRef.current === null) return;
      startYRef.current = null;
      if (pullDistanceRef.current >= TRIGGER_DISTANCE && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        void Promise.resolve(onRefreshRef.current()).finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          updatePull(0);
        });
      } else {
        updatePull(0);
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return { pullDistance, refreshing, triggerDistance: TRIGGER_DISTANCE };
}
