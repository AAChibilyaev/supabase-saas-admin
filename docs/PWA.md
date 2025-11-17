# Progressive Web App (PWA) Documentation

## Overview

The Supabase Admin Panel is a fully-featured Progressive Web App (PWA) that provides:

- **Installable**: Can be installed on desktop and mobile devices
- **Offline Support**: Works offline with cached resources
- **Fast Loading**: Optimized performance with service worker caching
- **Mobile-Responsive**: Fully optimized for mobile devices
- **Native-like Experience**: Runs in standalone mode without browser UI

## Features

### 1. Installation

The app can be installed on:

- **Desktop**: Chrome, Edge, Safari
- **Mobile**: iOS Safari, Android Chrome
- **All Platforms**: Any modern browser supporting PWA

#### Desktop Installation

1. Visit the app in Chrome, Edge, or other Chromium-based browsers
2. Look for the install icon in the address bar
3. Click "Install" when prompted
4. The app will open in a standalone window

#### Mobile Installation (iOS)

1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The app icon will appear on your home screen

#### Mobile Installation (Android)

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"
4. Confirm installation
5. The app icon will appear on your home screen

### 2. Offline Support

The PWA includes a service worker that caches:

- **Static Assets**: HTML, CSS, JavaScript files
- **Images**: Icons and images
- **Fonts**: Web fonts from Google Fonts
- **API Responses**: Cached for 5 minutes (configurable)

#### Offline Capabilities

When offline, you can:

- View previously loaded pages
- Access cached data
- Navigate between cached routes
- Use the app with limited functionality

#### Cache Strategy

- **Static Assets**: Cache First (long-term caching)
- **API Calls**: Network First with fallback to cache
- **Images**: Cache First with background sync
- **Google Fonts**: Cache First (1 year expiration)

### 3. Mobile Responsiveness

The app is fully responsive with:

#### Breakpoints

```css
/* Custom breakpoints defined in tailwind.config.js */
'xs': '475px',        // Extra small devices
'sm': '640px',        // Small devices
'md': '768px',        // Medium devices (tablets)
'lg': '1024px',       // Large devices
'xl': '1280px',       // Extra large devices
'2xl': '1536px',      // 2X large devices

/* Named breakpoints */
'mobile': {'max': '767px'},           // Mobile devices
'tablet': {'min': '768px', 'max': '1023px'},  // Tablets
'desktop': {'min': '1024px'},         // Desktop
'touch': {'max': '1023px'},           // Touch devices
'no-touch': {'min': '1024px'},        // Non-touch devices
```

#### Touch Optimization

- **Minimum Touch Target Size**: 44px x 44px (Apple's recommended size)
- **Touch Gestures**: Swipe, long press, pull-to-refresh
- **Safe Area Insets**: Support for notched devices
- **Smooth Scrolling**: Optimized for mobile browsers

#### Mobile Navigation

- **Drawer Menu**: Slide-out navigation on mobile
- **Touch-Optimized Buttons**: Larger tap targets
- **Responsive Tables**: Horizontal scrolling on mobile
- **Mobile-First Design**: Optimized for small screens

### 4. Performance Optimization

#### Code Splitting

The app uses Vite's automatic code splitting for optimal load times.

#### Lazy Loading

- Routes are lazy-loaded
- Images use loading="lazy" where appropriate
- Components are split into chunks

#### Caching Strategy

```typescript
// Service Worker Cache Configuration
{
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes
        }
      }
    }
  ]
}
```

## Components

### InstallPrompt Component

Located at: `src/components/pwa/InstallPrompt.tsx`

Displays a prompt to install the app:

- Auto-dismisses after 7 days if declined
- Appears 5 seconds after page load
- Respects user preference (won't show again if dismissed)

```tsx
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

// Usage in main.tsx
<InstallPrompt />
```

### UpdateNotification Component

Located at: `src/components/pwa/UpdateNotification.tsx`

Notifies users when an update is available:

- Shows when new version is detected
- Allows user to update immediately or later
- Automatically reloads app after update

```tsx
import { UpdateNotification } from '@/components/pwa/UpdateNotification'

// Usage in main.tsx
<UpdateNotification />
```

### MobileMenu Component

Located at: `src/components/layout/MobileMenu.tsx`

Provides touch-optimized navigation:

- Slide-out drawer on mobile devices
- Full menu with scrollable content
- Auto-closes when route changes

```tsx
import { MobileMenu } from '@/components/layout/MobileMenu'

// Usage in CustomLayout.tsx
<MobileMenu />
```

### ResponsiveTable Component

Located at: `src/components/ui/responsive-table.tsx`

Makes tables mobile-friendly:

- Desktop: Normal table view
- Mobile: Horizontal scrolling with ScrollArea

```tsx
import { ResponsiveTable } from '@/components/ui/responsive-table'

<ResponsiveTable>
  <table>
    {/* table content */}
  </table>
</ResponsiveTable>
```

## Hooks

### useTouchGestures

Located at: `src/hooks/useTouchGestures.ts`

Provides touch gesture detection:

```tsx
import { useTouchGestures } from '@/hooks/useTouchGestures'

const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures({
  threshold: 50,
  handlers: {
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
  }
})

<div
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
>
  Swipeable content
</div>
```

### useLongPress

Detects long press gestures:

```tsx
import { useLongPress } from '@/hooks/useTouchGestures'

const longPressHandlers = useLongPress(() => {
  console.log('Long pressed!')
}, 500) // 500ms duration

<button {...longPressHandlers}>
  Long press me
</button>
```

### useIsTouchDevice

Detects if device supports touch:

```tsx
import { useIsTouchDevice } from '@/hooks/useTouchGestures'

const isTouch = useIsTouchDevice()

{isTouch ? <MobileView /> : <DesktopView />}
```

### usePullToRefresh

Implements pull-to-refresh gesture:

```tsx
import { usePullToRefresh } from '@/hooks/useTouchGestures'

const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(async () => {
  // Refresh data
  await fetchData()
})
```

## Configuration

### Vite PWA Plugin

Configuration in `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-*.png'],
  manifest: {
    name: 'Supabase Admin Panel',
    short_name: 'Admin Panel',
    description: 'Advanced admin panel for Supabase',
    theme_color: '#000000',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [/* icon configuration */]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    runtimeCaching: [/* cache strategies */],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true
  }
})
```

### Manifest File

Located at: `public/manifest.json`

Defines PWA metadata:

- App name and description
- Icons for various sizes
- Display mode (standalone)
- Theme colors
- Start URL
- Shortcuts

### Icons

Generated icons in `public/`:

- `icon-72.png` through `icon-512.png`
- `icon-maskable-192.png` and `icon-maskable-512.png` (for adaptive icons)

Generate new icons:

```bash
node scripts/generate-icons.js
```

## Testing

### Desktop Testing

1. Open Chrome DevTools
2. Go to Application tab
3. Check "Service Workers" section
4. Verify manifest in "Manifest" section
5. Test offline mode in "Network" tab

### Mobile Testing

#### iOS Safari

1. Open Safari Developer Tools (on Mac)
2. Connect iPhone via USB
3. Enable Web Inspector on iPhone
4. Inspect the app through Safari on Mac

#### Android Chrome

1. Open Chrome DevTools on desktop
2. Connect Android device via USB
3. Go to `chrome://inspect`
4. Inspect the app on the device

### Lighthouse Audit

Run Lighthouse audit for PWA score:

```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run audit
lhci autorun --config=lighthouserc.json
```

## Troubleshooting

### PWA Not Installing

1. Check if HTTPS is enabled (required for PWA)
2. Verify manifest.json is accessible
3. Check service worker registration in DevTools
4. Ensure icons are properly sized and accessible

### Offline Mode Not Working

1. Verify service worker is active
2. Check cache in Application > Cache Storage
3. Ensure workbox configuration is correct
4. Clear cache and re-register service worker

### Update Not Showing

1. Force refresh the page (Ctrl+Shift+R)
2. Unregister old service worker
3. Clear browser cache
4. Check service worker lifecycle in DevTools

### Mobile Menu Not Showing

1. Verify screen size breakpoint
2. Check if Sheet component is imported correctly
3. Ensure Radix UI Dialog is installed
4. Check for CSS conflicts

## Best Practices

### 1. Always Test on Real Devices

Emulators don't accurately represent:

- Touch gestures
- Performance
- Safe area insets
- Network conditions

### 2. Optimize Images

- Use modern formats (WebP, AVIF)
- Provide multiple sizes
- Implement lazy loading
- Use proper alt text

### 3. Handle Offline State

```tsx
const [isOnline, setIsOnline] = useState(navigator.onLine)

useEffect(() => {
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])

{!isOnline && <OfflineBanner />}
```

### 4. Respect User Preferences

- Don't auto-install without permission
- Respect "reduced motion" preference
- Support dark mode
- Allow dismissal of prompts

### 5. Monitor Performance

- Track Core Web Vitals
- Monitor service worker errors
- Analyze cache hit rates
- Measure installation rates

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review DevTools console for errors
3. Check service worker status
4. Verify manifest configuration
5. Test on multiple devices and browsers
