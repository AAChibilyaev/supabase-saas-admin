import { Layout } from 'react-admin'
import type { LayoutProps } from 'react-admin'
import type { ReactNode } from 'react'

export const CustomLayout = (props: LayoutProps & { children: ReactNode }) => (
  <Layout {...props} />
)
