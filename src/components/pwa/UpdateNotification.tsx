import { useState, useLayoutEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const UpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  const {
    offlineReady: [offlineReady ],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: unknown) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

  useLayoutEffect(() => {
    if (needRefresh) {
      setTimeout(() => {
        setShowUpdatePrompt(true)
      }, 0)
    }
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
    setShowUpdatePrompt(false)
  }

  const handleDismiss = () => {
    setNeedRefresh(false)
    setShowUpdatePrompt(false)
  }

  if (offlineReady) {
    console.log('App ready to work offline')
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm mobile:right-4 mobile:max-w-none">
      <Card className="shadow-lg border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Update Available</CardTitle>
          </div>
          <CardDescription>
            A new version is available. Reload to update.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleUpdate} className="flex-1">
            Reload Now
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Later
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
