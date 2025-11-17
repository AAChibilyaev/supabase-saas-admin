# SignupForm Component Documentation

## Обзор

Компонент `SignupForm` предоставляет полнофункциональную форму регистрации с интеграцией Supabase Auth, включая:

- Email/Password регистрацию
- OAuth с Google
- Валидацию формы
- Обработку ошибок
- Индикатор загрузки
- Уведомления об успехе/ошибке

## Расположение файлов

- Компонент: `/src/components/signup-form.tsx`
- Пример страницы: `/src/pages/Signup.tsx`

## Использование

### Базовое использование

```tsx
import { SignupForm } from "@/components/signup-form"

function MySignupPage() {
  return <SignupForm />
}
```

### С callback после успешной регистрации

```tsx
import { SignupForm } from "@/components/signup-form"
import { useNavigate } from "react-router-dom"

function MySignupPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate("/dashboard")
  }

  return <SignupForm onSuccess={handleSuccess} />
}
```

### С дополнительными стилями

```tsx
import { SignupForm } from "@/components/signup-form"

function MySignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignupForm className="max-w-md w-full" />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Дополнительные CSS классы |
| `onSuccess` | `() => void` | `undefined` | Callback после успешной регистрации |

## Функциональность

### 1. Email/Password регистрация

- Валидация обязательных полей
- Проверка формата email
- Минимальная длина пароля (8 символов)
- Подтверждение пароля
- Сохранение Full Name в user_metadata

### 2. OAuth с Google

- Один клик для регистрации через Google
- Автоматический редирект на `/auth/callback`
- Обработка ошибок OAuth

### 3. Валидация

Компонент выполняет следующие проверки:

- **Full Name**: не пустое поле
- **Email**: валидный email формат
- **Password**: минимум 8 символов
- **Confirm Password**: совпадение с паролем

### 4. Обработка ошибок

Компонент обрабатывает следующие ошибки:

- Дубликат email (уже зарегистрирован)
- Ошибки валидации
- Ошибки Supabase Auth
- Ошибки OAuth

### 5. UI/UX особенности

- Индикатор загрузки на кнопках
- Красная обводка полей с ошибками
- Сообщения об ошибках под полями
- Success/Error alerts
- Автоматическая очистка ошибок при вводе
- Disabled состояние при загрузке

## Интеграция с Supabase

### Email Confirmation

После успешной регистрации Supabase отправляет письмо подтверждения на указанный email.
Пользователь должен перейти по ссылке в письме для активации аккаунта.

### Redirect URL

Компонент настроен на редирект на `/auth/callback` после:
- Подтверждения email
- OAuth аутентификации

### User Metadata

При регистрации в `user_metadata` сохраняется:

```json
{
  "full_name": "John Doe"
}
```

## Настройка Google OAuth

Для работы OAuth с Google необходимо:

1. Настроить Google OAuth в Supabase Dashboard:
   - Authentication → Providers → Google
   - Добавить Client ID и Client Secret
   - Настроить Authorized redirect URIs

2. Добавить redirect URL в Google Console:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

## Примеры сообщений

### Success
```
"Account created successfully! Please check your email to verify your account."
```

### Errors
```
"Full name is required"
"Invalid email format"
"Password must be at least 8 characters"
"Passwords do not match"
"This email is already registered. Please sign in instead."
```

## Зависимости

- `@/lib/supabase` - Supabase client
- `@/components/ui/*` - shadcn/ui компоненты
- `lucide-react` - иконки
- `react` - useState hook

## Структура данных формы

```typescript
interface FormData {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

interface Errors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}
```

## Безопасность

- Пароли никогда не сохраняются в локальном состоянии после отправки
- Используется PKCE flow для аутентификации
- Email confirmation для предотвращения спама
- Проверка на дубликаты email

## Следующие шаги

После внедрения компонента рекомендуется:

1. Настроить email templates в Supabase
2. Добавить страницу `/auth/callback` для обработки редиректов
3. Настроить Google OAuth credentials
4. Добавить rate limiting для предотвращения спама
5. Настроить multi-tenant permissions после регистрации

## Связанные компоненты

- `LoginForm` - компонент входа
- `AcceptInvitation` - принятие приглашений в tenant

## Troubleshooting

### "Missing Supabase environment variables"
Убедитесь, что в `.env` файле присутствуют:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Email не отправляется
Проверьте настройки Email в Supabase Dashboard:
- Authentication → Email Templates
- Settings → Auth

### Google OAuth не работает
1. Проверьте Client ID и Secret в Supabase
2. Убедитесь, что redirect URL правильно настроен в Google Console
3. Проверьте, что Google Provider включен в Supabase
