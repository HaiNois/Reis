import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

type DialogType = 'confirm' | 'warning' | 'error' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: DialogType
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  loading?: boolean
}

const typeConfig = {
  confirm: {
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    confirmVariant: 'default' as const,
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    confirmVariant: 'default' as const,
  },
  error: {
    icon: <XCircle className="h-6 w-6 text-red-600" />,
    confirmVariant: 'destructive' as const,
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    confirmVariant: 'default' as const,
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  type = 'confirm',
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const config = typeConfig[type]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-2">
            <AlertDialogMedia>{config.icon}</AlertDialogMedia>
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            variant={config.confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Standalone confirm function for easy use
export interface ConfirmOptions {
  type?: DialogType
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  // This will be handled by a context provider
  // For now, return a placeholder that needs to be implemented with a context
  return new Promise(() => {
    // Dispatch custom event that can be caught by a global handler
    window.dispatchEvent(
      new CustomEvent('show-confirm-dialog', { detail: options })
    )
  })
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    options: ConfirmOptions | null
  }>({
    open: false,
    options: null,
  })

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({ open: true, options })
      // Store resolve function
      ;(window as any).__confirmResolve = resolve
    })
  }

  const handleConfirm = () => {
    if ((window as any).__confirmResolve) {
      ;(window as any).__confirmResolve(true)
    }
    setDialogState({ open: false, options: null })
    delete (window as any).__confirmResolve
  }

  const handleCancel = () => {
    if ((window as any).__confirmResolve) {
      ;(window as any).__confirmResolve(false)
    }
    setDialogState({ open: false, options: null })
    delete (window as any).__confirmResolve
  }

  return { dialogState, confirm, handleConfirm, handleCancel }
}

// Re-export AlertDialog components for flexibility
export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}