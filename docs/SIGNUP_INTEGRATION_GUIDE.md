# SignupForm Integration Guide

## Созданные файлы

1. **SignupForm Component**: `/src/components/signup-form.tsx`
2. **Signup Page**: `/src/pages/Signup.tsx`
3. **Auth Callback Page**: `/src/pages/AuthCallback.tsx`
4. **Documentation**: `/docs/SIGNUP_COMPONENT.md`

## Шаг 1: Добавление маршрутов

Поскольку это React Admin приложение, вам нужно добавить кастомные маршруты для страниц регистрации и callback.

### Создайте файл с кастомными маршрутами

Создайте файл `/src/CustomRoutes.tsx`:

```tsx
import { Route } from 'react-router-dom'
import { Signup } from './pages/Signup'
import { AuthCallback } from './pages/AuthCallback'

export const CustomRoutes = [
  <Route path="/signup" element={<Signup />} />,
  <Route path="/auth/callback" element={<AuthCallback />} />
]
```

### Добавьте CustomRoutes в App.tsx

В файле `/src/App.tsx` добавьте CustomRoutes:

```tsx
import { Admin, Resource, CustomRoutes as RACustomRoutes } from 'react-admin'
import { CustomRoutes } from './CustomRoutes'

// ... остальные импорты

function App() {
  return (
    <Admin>
      <RACustomRoutes>
        {CustomRoutes}
      </RACustomRoutes>

      {/* Ваши ресурсы */}
      <Resource name="tenants" ... />
      {/* ... */}
    </Admin>
  )
}
```

## Шаг 2: Настройка Supabase Auth

### 1. Email Templates

В Supabase Dashboard настройте Email Templates:

**Authentication → Email Templates → Confirm signup**

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### 2. URL Configuration

В Supabase Dashboard настройте Redirect URLs:

**Authentication → URL Configuration**

Добавьте в Site URL и Redirect URLs:

```
http://localhost:5173/auth/callback
https://your-domain.com/auth/callback
```

### 3. Email Settings

Настройте SMTP для отправки писем:

**Settings → Auth → SMTP Settings**

Либо используйте встроенный Supabase SMTP (ограничен 3 письмами в час).

## Шаг 3: Настройка Google OAuth (опционально)

### 1. Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID:
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     https://your-domain.com
     ```
   - Authorized redirect URIs:
     ```
     https://your-project.supabase.co/auth/v1/callback
     ```

### 2. Supabase Dashboard

1. Перейдите в **Authentication → Providers → Google**
2. Включите Google Provider
3. Добавьте:
   - Client ID (from Google Console)
   - Client Secret (from Google Console)
4. Сохраните

## Шаг 4: Обновление LoginForm

Добавьте ссылку на страницу регистрации в LoginForm:

```tsx
// В файле /src/components/login-form.tsx

<div className="mt-4 text-center text-sm">
  Don't have an account?{" "}
  <a href="/signup" className="underline underline-offset-4">
    Sign up
  </a>
</div>
```

## Шаг 5: Настройка tenant после регистрации

После успешной регистрации пользователя, вам может понадобиться:

1. Создать tenant для пользователя
2. Добавить запись в таблицу `user_tenants`
3. Назначить роль пользователю

### Вариант 1: Database Trigger

Создайте trigger в Supabase:

```sql
-- Функция для создания tenant при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Создаем новый tenant
  INSERT INTO public.tenants (name, slug, plan_type)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user-' || NEW.id,
    'free'
  )
  RETURNING id INTO new_tenant_id;

  -- Связываем пользователя с tenant
  INSERT INTO public.user_tenants (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Вариант 2: Edge Function

Создайте Edge Function, которая вызывается после регистрации.

## Шаг 6: Тестирование

### Тесты для выполнения:

1. **Email/Password Registration**
   - Регистрация с валидными данными
   - Проверка email подтверждения
   - Попытка регистрации с существующим email
   - Валидация полей формы

2. **Google OAuth**
   - Регистрация через Google
   - Проверка создания пользователя
   - Проверка редиректа после успеха

3. **Auth Callback**
   - Переход по ссылке из email
   - OAuth redirect
   - Обработка ошибок

4. **Error Handling**
   - Невалидный email
   - Слабый пароль
   - Несовпадающие пароли
   - Сетевые ошибки

## Шаг 7: Production Checklist

- [ ] Настроены Email Templates в Supabase
- [ ] Настроен SMTP для production
- [ ] Добавлены production redirect URLs
- [ ] Google OAuth настроен (если используется)
- [ ] Созданы database triggers для tenant creation
- [ ] Настроен rate limiting для signup
- [ ] Добавлены тесты для signup flow
- [ ] Проверена работа email confirmation
- [ ] Настроен мониторинг ошибок регистрации
- [ ] Добавлена Google reCAPTCHA (опционально)

## Дополнительные улучшения

### 1. reCAPTCHA

Добавьте Google reCAPTCHA для защиты от ботов:

```tsx
import ReCAPTCHA from "react-google-recaptcha"

// В SignupForm
const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

<ReCAPTCHA
  sitekey="your-site-key"
  onChange={(token) => setRecaptchaToken(token)}
/>
```

### 2. Password Strength Indicator

```tsx
import { Progress } from "@/components/ui/progress"

const getPasswordStrength = (password: string) => {
  let strength = 0
  if (password.length >= 8) strength += 25
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
  if (/\d/.test(password)) strength += 25
  if (/[^a-zA-Z\d]/.test(password)) strength += 25
  return strength
}

<Progress value={getPasswordStrength(formData.password)} />
```

### 3. Email Domain Validation

```tsx
const ALLOWED_DOMAINS = ['company.com', 'example.com']

const isEmailAllowed = (email: string) => {
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}
```

### 4. Terms and Conditions

```tsx
import { Checkbox } from "@/components/ui/checkbox"

const [acceptedTerms, setAcceptedTerms] = useState(false)

<div className="flex items-center space-x-2">
  <Checkbox
    id="terms"
    checked={acceptedTerms}
    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
  />
  <label htmlFor="terms" className="text-sm">
    I accept the{" "}
    <a href="/terms" className="underline">
      Terms and Conditions
    </a>
  </label>
</div>
```

## Troubleshooting

### Проблема: Email не приходит

**Решение:**
1. Проверьте SMTP настройки в Supabase
2. Проверьте папку спам
3. Убедитесь, что Email Templates настроены
4. Проверьте логи в Supabase Dashboard

### Проблема: Google OAuth не работает

**Решение:**
1. Проверьте Client ID и Secret
2. Убедитесь, что redirect URI совпадает
3. Проверьте, что Google Provider включен
4. Проверьте Authorized domains в Google Console

### Проблема: "Missing Supabase environment variables"

**Решение:**
1. Создайте `.env` файл в корне проекта
2. Добавьте переменные:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
3. Перезапустите dev server

## Связанные документы

- [SignupForm Component Documentation](./SIGNUP_COMPONENT.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Admin Custom Routes](https://marmelab.com/react-admin/CustomRoutes.html)
