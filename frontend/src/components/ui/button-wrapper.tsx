// Backward compatibility wrapper for Button component
// Preserves existing .btn, .btn-primary, .btn-secondary, .btn-outline classes

import React from "react"
import { Button as ShadcnButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  // Map existing variants to shadcn variants
  const variantMap: Record<string, "default" | "secondary" | "outline" | "ghost" | "link" | "destructive"> = {
    primary: "default",
    default: "default",
    secondary: "secondary",
    outline: "outline",
    ghost: "ghost",
    link: "link",
    destructive: "destructive",
  }

  // Map existing sizes
  const sizeMap: Record<string, "default" | "sm" | "lg" | "icon"> = {
    default: "default",
    sm: "sm",
    lg: "lg",
    icon: "icon",
  }

  return (
    <ShadcnButton
      className={cn(
        // Preserve backward compatibility with existing button classes
        "btn inline-flex items-center justify-center px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-200",
        variant === "primary" && "bg-black text-white hover:bg-gray-800",
        variant === "secondary" && "bg-gray-100 text-black hover:bg-gray-200",
        variant === "outline" && "border border-black text-black hover:bg-black hover:text-white",
        className
      )}
      variant={variantMap[variant] || "default"}
      size={sizeMap[size] || "default"}
      {...props}
    />
  )
}

export { Button as ShadcnButton } from "@/components/ui/button"