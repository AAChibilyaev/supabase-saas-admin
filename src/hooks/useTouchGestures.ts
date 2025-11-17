import { useCallback, useEffect, useRef, useState } from 'react'

interface TouchPosition {
  x: number
  y: number
}

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface TouchGestureOptions {
  threshold?: number // Minimum distance for swipe
  handlers?: SwipeHandlers
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const { threshold = 50, handlers = {} } = options
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const distanceX = touchStart.current.x - touchEnd.current.x
    const distanceY = touchStart.current.y - touchEnd.current.y

    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe) {
      if (distanceX > threshold && handlers.onSwipeLeft) {
        handlers.onSwipeLeft()
      } else if (distanceX < -threshold && handlers.onSwipeRight) {
        handlers.onSwipeRight()
      }
    } else {
      if (distanceY > threshold && handlers.onSwipeUp) {
        handlers.onSwipeUp()
      } else if (distanceY < -threshold && handlers.onSwipeDown) {
        handlers.onSwipeDown()
      }
    }
  }, [threshold, handlers])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

// Hook for detecting long press
export const useLongPress = (
  callback: () => void,
  duration: number = 500
) => {
  const timeout = useRef<NodeJS.Timeout>()

  const start = useCallback(() => {
    timeout.current = setTimeout(callback, duration)
  }, [callback, duration])

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  }
}

// Hook for detecting if device supports touch
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setIsTouch(hasTouch)
  }, [])

  return isTouch
}

// Hook for pull-to-refresh gesture
export const usePullToRefresh = (onRefresh: () => void | Promise<void>) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const threshold = 80 // pixels to trigger refresh

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start if scrolled to top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === 0) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(distance)
      setIsPulling(true)
      e.preventDefault()
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold) {
      await onRefresh()
    }
    setIsPulling(false)
    setPullDistance(0)
    startY.current = 0
  }, [pullDistance, threshold, onRefresh])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isPulling,
    pullDistance: Math.min(pullDistance, threshold),
    isRefreshing: isPulling && pullDistance > threshold,
  }
}
