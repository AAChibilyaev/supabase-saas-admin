import { Layout, AppBar } from 'react-admin'
import type { LayoutProps } from 'react-admin'
import type { ReactNode } from 'react'
import { TenantSwitcher } from '../TenantSwitcher'
import { CustomMenu } from './CustomMenu'
import { ThemeToggle } from '../ui/theme-toggle'

const CustomAppBar = () => (
  <AppBar>
    <div className="flex-1" />
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <TenantSwitcher />
    </div>
  </AppBar>
)

export const CustomLayout = (props: LayoutProps & { children: ReactNode }) => (
  <Layout {...props} appBar={CustomAppBar} menu={CustomMenu} />
)
