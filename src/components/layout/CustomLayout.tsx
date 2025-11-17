import { Layout, AppBar } from 'react-admin'
import type { LayoutProps } from 'react-admin'
import type { ReactNode } from 'react'
import { TenantSwitcher } from '../TenantSwitcher'

const CustomAppBar = () => (
  <AppBar>
    <div className="flex-1" />
    <TenantSwitcher />
  </AppBar>
)

export const CustomLayout = (props: LayoutProps & { children: ReactNode }) => (
  <Layout {...props} appBar={CustomAppBar} />
)
