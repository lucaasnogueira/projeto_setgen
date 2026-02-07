import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastActionElement = React.ReactElement<any>

export const useToast = () => {
  const toast = ({ title, description, variant }: ToastProps) => {
    console.log('Toast:', { title, description, variant })
    // Implementação simplificada - pode usar biblioteca como sonner
  }

  return { toast }
}

export { type ToastProps }
