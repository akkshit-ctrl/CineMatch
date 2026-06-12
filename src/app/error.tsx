'use client'

import { Button } from '@/components/ui/button'

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto max-w-lg px-4 py-12 text-center space-y-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
