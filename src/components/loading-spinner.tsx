import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ className, fullScreen }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-16'}`}>
      <Loader2 data-testid="loader-icon" className={`w-8 h-8 animate-spin text-primary ${className ?? ''}`} />
    </div>
  )
}
