import { Layout, AppBar } from 'react-admin'
import type { LayoutProps } from 'react-admin'
import type { ReactNode } from 'react'
import { TenantSwitcher } from '../TenantSwitcher'
import { CustomMenu } from './CustomMenu'
import { MobileMenu } from './MobileMenu'
import { ThemeToggle } from '../ui/theme-toggle'

const CustomAppBar = () => (
  <AppBar className="mobile:px-2">
    <div className="flex items-center gap-2">
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <MobileMenu />
      </div>
      <div className="flex-1" />
      {/* Desktop Controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <TenantSwitcher />
      </div>
    </div>
  </AppBar>
)

export const CustomLayout = (props: LayoutProps & { children: ReactNode }) => (
  <Layout {...props} appBar={CustomAppBar} menu={CustomMenu} />
)
