// Backward compatibility wrapper for Input component
// Preserves existing .input class styling

import React from "react"
import { Input as ShadcnInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // No additional props needed - preserves all original functionality
}

export function Input({ className, ...props }: InputProps) {
  return (
    <ShadcnInput
      className={cn(
        // Preserve backward compatibility with existing .input class
        "w-full px-4 py-3 border border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Input as ShadcnInput } from "@/components/ui/input"