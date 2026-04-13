import { useEffect, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook to track unsaved changes and warn user before leaving
 */
export function useDirtyState<T extends Record<string, any>>(initialData: T) {
  const [initialValues] = useState(() => JSON.stringify(initialData))
  const [currentValues, setCurrentValues] = useState(() => JSON.stringify(initialData))
  const [isDirty, setIsDirty] = useState(false)

  const updateValues = useCallback((updater: (prev: T) => T) => {
    setCurrentValues(prev => {
      const prevObj = JSON.parse(prev)
      const newObj = updater(prevObj)
      const newStr = JSON.stringify(newObj)
      setIsDirty(newStr !== initialValues)
      return newStr
    })
  }, [initialValues])

  const setValues = useCallback((newValues: T) => {
    const newStr = JSON.stringify(newValues)
    setCurrentValues(newStr)
    setIsDirty(newStr !== initialValues)
  }, [initialValues])

  const reset = useCallback(() => {
    setCurrentValues(initialValues)
    setIsDirty(false)
  }, [initialValues])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return {
    isDirty,
    updateValues,
    setValues,
    reset,
    getValues: () => JSON.parse(currentValues) as T,
  }
}

/**
 * Hook to confirm navigation when there are unsaved changes
 */
export function useNavigateWithDirtyCheck(
  isDirty: boolean,
  navigate: ReturnType<typeof useNavigate>
) {
  const handleNavigate = useCallback((to: string) => {
    if (!isDirty) {
      navigate(to)
      return
    }

    const confirmed = window.confirm(
      'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?'
    )
    if (confirmed) {
      navigate(to)
    }
  }, [isDirty, navigate])

  return handleNavigate
}
