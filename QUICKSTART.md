# Быстрый старт

Этот гайд поможет вам быстро запустить Supabase Admin Panel.

## Шаг 1: Настройка Supabase

1. Создайте аккаунт на [supabase.com](https://supabase.com) (если у вас его еще нет)
2. Создайте новый проект
3. Перейдите в SQL Editor и выполните SQL скрипт из файла `supabase-setup.sql`
4. Перейдите в Authentication > Users и создайте тестового пользователя

## Шаг 2: Настройка проекта

1. Скопируйте файл `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Откройте `.env` и заполните переменные окружения:
   - `VITE_SUPABASE_URL` - URL вашего проекта (Project Settings > API > Project URL)
   - `VITE_SUPABASE_ANON_KEY` - Anon key (Project Settings > API > Project API keys > anon public)

Пример:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Шаг 3: Установка зависимостей

```bash
npm install
```

## Шаг 4: Запуск приложения

```bash
npm run dev
```

Откройте браузер по адресу: `http://localhost:5173`

## Шаг 5: Вход в систему

Используйте email и пароль пользователя, которого вы создали в Supabase Authentication.

## Что дальше?

- **Добавление новых ресурсов**: См. секцию "Добавление новых ресурсов" в README.md
- **Добавление компонентов shadcn**: Используйте `npx shadcn@latest add [component-name]`
- **Настройка темы**: Измените CSS переменные в `src/index.css`

## Структура таблиц

### Users
- `id` - UUID (Primary Key)
- `email` - TEXT (Unique)
- `full_name` - TEXT
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### Posts
- `id` - UUID (Primary Key)
- `title` - TEXT
- `content` - TEXT
- `user_id` - UUID (Foreign Key -> users.id)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

## Полезные команды

```bash
# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр production сборки
npm run preview

# Добавление shadcn компонентов
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

## Troubleshooting

### Ошибка подключения к Supabase
- Проверьте, что переменные окружения в `.env` правильные
- Убедитесь, что вы создали таблицы в Supabase
- Проверьте, что RLS политики настроены правильно

### Ошибка при логине
- Убедитесь, что вы создали пользователя в Supabase Authentication
- Проверьте, что email и пароль введены правильно

### Ошибки при сборке
- Удалите `node_modules` и `package-lock.json`, затем выполните `npm install`
- Убедитесь, что используется Node.js версии 18 или выше

## Дополнительная помощь

- [React Admin Docs](https://marmelab.com/react-admin/)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
