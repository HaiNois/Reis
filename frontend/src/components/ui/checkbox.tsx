import * as React from "react"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onClick, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={`w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer ${className || ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(e)
        }}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
