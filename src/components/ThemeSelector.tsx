import { useEffect, useState } from 'react'
import { Admin, type AdminProps } from 'react-admin'
import { useTheme } from 'next-themes'
import { compositeDataProvider } from '../providers/compositeDataProvider'
import { authProvider } from '../providers/authProvider'

interface ThemeSelectorProps {
  children: AdminProps['children']
  dashboard: AdminProps['dashboard']
  layout: AdminProps['layout']
  lightTheme: AdminProps['theme']
  darkTheme: AdminProps['theme']
}

export function ThemeSelector({
  children,
  dashboard,
  layout,
  lightTheme,
  darkTheme
}: ThemeSelectorProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Determine which theme to use
  const currentTheme = theme === 'system'
    ? (systemTheme === 'dark' ? darkTheme : lightTheme)
    : (theme === 'dark' ? darkTheme : lightTheme)

  return (
    <Admin
      dataProvider={compositeDataProvider}
      authProvider={authProvider}
      theme={currentTheme}
      dashboard={dashboard}
      layout={layout}
      requireAuth
    >
      {children}
    </Admin>
  )
}
