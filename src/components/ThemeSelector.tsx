import { useEffect, useState } from 'react'
import { Admin, type AdminProps, CustomRoutes } from 'react-admin'
import { useTheme } from 'next-themes'
import { Route } from 'react-router-dom'
import { compositeDataProvider } from '../providers/compositeDataProvider'
import { authProvider } from '../providers/authProvider'
import { AcceptInvitation } from '../pages/AcceptInvitation'

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
      <CustomRoutes noLayout>
        <Route path="/accept-invite/:token" element={<AcceptInvitation />} />
      </CustomRoutes>
    </Admin>
  )
}
