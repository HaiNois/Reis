import React, { createContext, useContext, useState, useCallback } from 'react'
import { ConfirmDialog, ConfirmOptions } from '@/components/ui/confirm-dialog'

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    options: (ConfirmOptions & { onResolve?: (value: boolean) => void }) | null
  }>({
    open: false,
    options: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options: { ...options, onResolve: resolve },
      })
    })
  }, [])

  const handleConfirm = () => {
    dialogState.options?.onResolve?.(true)
    setDialogState({ open: false, options: null })
  }

  const handleCancel = () => {
    dialogState.options?.onResolve?.(false)
    setDialogState({ open: false, options: null })
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={(open) => !open && handleCancel()}
        type={dialogState.options?.type}
        title={dialogState.options?.title || ''}
        description={dialogState.options?.description || ''}
        confirmText={dialogState.options?.confirmText}
        cancelText={dialogState.options?.cancelText}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

// Helper function for easy access anywhere
export function confirm(options: ConfirmOptions): Promise<boolean> {
  // This will be handled by the global provider
  // If no provider, show a simple alert
  const event = new CustomEvent('global-confirm', { detail: options })
  window.dispatchEvent(event)

  return new Promise((resolve) => {
    // Store resolve in window for the provider to pick up
    ;(window as any).__confirmResolve = resolve
    // Auto-resolve after timeout as fallback
    setTimeout(() => {
      if ((window as any).__confirmResolve) {
        ;(window as any).__confirmResolve(false)
        delete (window as any).__confirmResolve
      }
    }, 10000)
  })
}