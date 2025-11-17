# Mobile Responsive Design Guide

## Overview

This document outlines the mobile-first responsive design implementation for the Supabase Admin Panel.

## Breakpoints

### Tailwind CSS Breakpoints

```javascript
// tailwind.config.js
screens: {
  'xs': '475px',      // Extra small devices
  'sm': '640px',      // Small devices
  'md': '768px',      // Medium devices (tablets)
  'lg': '1024px',     // Large devices
  'xl': '1280px',     // Extra large devices
  '2xl': '1536px',    // 2X large devices

  // Custom named breakpoints
  'mobile': {'max': '767px'},
  'tablet': {'min': '768px', 'max': '1023px'},
  'desktop': {'min': '1024px'},
  'touch': {'max': '1023px'},
  'no-touch': {'min': '1024px'},
}
```

### Usage Examples

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile only</div>

// Responsive padding
<div className="p-2 md:p-4 lg:p-6">Responsive padding</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Touch-specific styles
<button className="touch:min-h-touch touch:min-w-touch">
  Touch-optimized button
</button>
```

## Touch Targets

### Minimum Sizes

All interactive elements should meet minimum touch target sizes:

- **Minimum**: 44px x 44px (Apple HIG)
- **Recommended**: 48px x 48px (Material Design)

```tsx
// Using custom Tailwind utilities
<button className="min-h-touch min-w-touch">Button</button>
<button className="min-h-touch-lg min-w-touch-lg">Large Button</button>

// Inline styles
<button style={{ minHeight: '44px', minWidth: '44px' }}>Button</button>
```

### Spacing

Ensure adequate spacing between touch targets:

```tsx
// Minimum 8px spacing
<div className="flex gap-2">
  <button className="min-h-touch">Button 1</button>
  <button className="min-h-touch">Button 2</button>
</div>
```

## Safe Area Insets

Support for devices with notches and rounded corners:

```css
/* Tailwind utilities defined in config */
.pt-safe-top { padding-top: env(safe-area-inset-top); }
.pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.pl-safe-left { padding-left: env(safe-area-inset-left); }
.pr-safe-right { padding-right: env(safe-area-inset-right); }
```

```tsx
// Usage
<div className="pt-safe-top pb-safe-bottom">
  Content respects safe areas
</div>
```

## Navigation

### Desktop Navigation

- Standard sidebar menu
- Horizontal navigation
- Dropdown menus

### Mobile Navigation

- Drawer/Sheet component (slide-out)
- Bottom navigation (optional)
- Hamburger menu icon

```tsx
// Mobile menu implementation
import { MobileMenu } from '@/components/layout/MobileMenu'

<div className="md:hidden">
  <MobileMenu />
</div>
```

## Tables

### Desktop Tables

Standard table layout with all columns visible.

### Mobile Tables

Two approaches:

#### 1. Horizontal Scrolling

```tsx
import { ResponsiveTable } from '@/components/ui/responsive-table'

<ResponsiveTable>
  <table>
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
        <th>Column 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
        <td>Data 3</td>
      </tr>
    </tbody>
  </table>
</ResponsiveTable>
```

#### 2. Card Layout

```tsx
import { MobileCardList } from '@/components/ui/responsive-table'

const items = [/* data */]

<MobileCardList
  items={items}
  renderCard={(item, index) => (
    <Card key={index}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{item.description}</p>
      </CardContent>
    </Card>
  )}
/>
```

## Typography

### Responsive Font Sizes

```tsx
// Heading sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h1>

// Body text
<p className="text-sm md:text-base">Responsive text</p>
```

### Line Heights

Ensure readable line heights on mobile:

```css
/* Mobile: tighter line heights */
@media (max-width: 767px) {
  body {
    line-height: 1.5;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
  }
}
```

## Images

### Responsive Images

```tsx
// Using srcset for responsive images
<img
  src="/image-mobile.jpg"
  srcSet="
    /image-mobile.jpg 480w,
    /image-tablet.jpg 768w,
    /image-desktop.jpg 1200w
  "
  sizes="
    (max-width: 768px) 480px,
    (max-width: 1024px) 768px,
    1200px
  "
  alt="Description"
  loading="lazy"
/>
```

### Aspect Ratios

```tsx
// Maintain aspect ratio
<div className="aspect-video w-full">
  <img src="/image.jpg" className="object-cover w-full h-full" />
</div>

<div className="aspect-square w-full">
  <img src="/icon.jpg" className="object-contain w-full h-full" />
</div>
```

## Forms

### Mobile-Optimized Forms

```tsx
<form className="space-y-4">
  {/* Full-width inputs on mobile */}
  <input
    type="text"
    className="w-full p-3 text-base"
    placeholder="Email"
  />

  {/* Larger buttons on mobile */}
  <button className="w-full min-h-touch-lg text-lg">
    Submit
  </button>
</form>
```

### Input Types

Use appropriate input types for mobile keyboards:

```tsx
<input type="email" />      {/* Shows @ key */}
<input type="tel" />        {/* Shows number pad */}
<input type="number" />     {/* Shows numeric keyboard */}
<input type="url" />        {/* Shows .com key */}
<input type="search" />     {/* Shows search button */}
```

## Modals and Dialogs

### Desktop Modals

Center-aligned, fixed width.

### Mobile Modals

Full-screen or bottom sheet:

```tsx
import { Sheet, SheetContent } from '@/components/ui/sheet'

<Sheet>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

## Touch Gestures

### Swipe Gestures

```tsx
import { useTouchGestures } from '@/hooks/useTouchGestures'

const gestures = useTouchGestures({
  threshold: 50,
  handlers: {
    onSwipeLeft: () => console.log('Next'),
    onSwipeRight: () => console.log('Previous'),
  }
})

<div {...gestures}>
  Swipeable content
</div>
```

### Long Press

```tsx
import { useLongPress } from '@/hooks/useTouchGestures'

const longPress = useLongPress(() => {
  console.log('Show context menu')
}, 500)

<div {...longPress}>
  Long press me
</div>
```

### Pull to Refresh

```tsx
import { usePullToRefresh } from '@/hooks/useTouchGestures'

const { isPulling, pullDistance } = usePullToRefresh(async () => {
  await refreshData()
})

<div style={{ transform: `translateY(${pullDistance}px)` }}>
  {isPulling && <RefreshIndicator />}
  <Content />
</div>
```

## Performance

### Mobile Optimization

1. **Code Splitting**: Load components on demand
2. **Lazy Loading**: Defer non-critical resources
3. **Image Optimization**: Use WebP, compress images
4. **Reduce Bundle Size**: Tree-shaking, minification
5. **Cache Assets**: Service worker caching

### Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton'

{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Content />
)}
```

## Testing

### Responsive Testing Tools

1. **Chrome DevTools**: Device emulation
2. **Firefox Responsive Design Mode**: Test multiple sizes
3. **Safari Web Inspector**: iOS device testing
4. **Real Devices**: Always test on actual devices

### Test Checklist

- [ ] All pages render correctly on mobile
- [ ] Touch targets are minimum 44px x 44px
- [ ] Navigation is accessible on mobile
- [ ] Forms are usable on mobile keyboards
- [ ] Images are optimized and responsive
- [ ] Tables are scrollable or use card layout
- [ ] Modals work on small screens
- [ ] Text is readable without zooming
- [ ] Safe areas are respected on notched devices
- [ ] App works in both portrait and landscape

## Common Patterns

### Responsive Container

```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

### Responsive Flexbox

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Column 1</div>
  <div className="flex-1">Column 2</div>
</div>
```

### Conditional Rendering

```tsx
import { useIsTouchDevice } from '@/hooks/useTouchGestures'

const isTouch = useIsTouchDevice()

{isTouch ? (
  <MobileComponent />
) : (
  <DesktopComponent />
)}
```

## Accessibility

### Mobile Accessibility

1. **Font Size**: Minimum 16px for body text
2. **Contrast**: WCAG AA minimum (4.5:1)
3. **Touch Targets**: Minimum 44px x 44px
4. **Focus States**: Visible on keyboard navigation
5. **Screen Readers**: Proper ARIA labels

```tsx
// Accessible mobile button
<button
  className="min-h-touch min-w-touch"
  aria-label="Close menu"
>
  <X className="h-6 w-6" />
</button>
```

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive Web Design](https://web.dev/responsive-web-design-basics/)
