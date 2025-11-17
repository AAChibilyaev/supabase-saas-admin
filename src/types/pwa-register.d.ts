declare module 'virtual:pwa-register/react' {
  export interface UseRegisterSWReturn {
    needRefresh: boolean
    offlineReady: boolean
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }

  export function useRegisterSW(options?: {
    immediate?: boolean
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }): UseRegisterSWReturn
}
