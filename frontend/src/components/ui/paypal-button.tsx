import { Loader2 } from 'lucide-react'

interface PayPalButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export function PayPalButton({ onClick, loading = false, disabled = false }: PayPalButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full h-14 bg-[#ffc439] hover:bg-[#ffb933] text-[#003087] font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <img
            src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
            alt="PayPal"
            className="h-6 w-auto"
          />
        </>
      )}
    </button>
  )
}
