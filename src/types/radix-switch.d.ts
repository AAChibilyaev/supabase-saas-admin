declare module '@radix-ui/react-switch' {
  import * as React from 'react'

  export interface SwitchProps extends React.ComponentPropsWithoutRef<'button'> {
    checked?: boolean
    defaultChecked?: boolean
    required?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
  }

  export const Root: React.ForwardRefExoticComponent<
    SwitchProps & React.RefAttributes<HTMLButtonElement>
  >
  export const Thumb: React.ForwardRefExoticComponent<
    React.ComponentPropsWithoutRef<'span'> & React.RefAttributes<HTMLSpanElement>
  >
}
