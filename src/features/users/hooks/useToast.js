import { useState, useRef, useEffect, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToast({ id, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3200)
  }, [])

  return { toast, showToast }
}
