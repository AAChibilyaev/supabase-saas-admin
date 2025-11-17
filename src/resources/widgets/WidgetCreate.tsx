import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  required,
  useNotify,
  useRedirect,
} from 'react-admin'
import { WidgetBuilder } from './WidgetBuilder'

export const WidgetCreate = () => {
  return <WidgetBuilder />
}
