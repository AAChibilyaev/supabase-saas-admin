# 🎯 Action Plan: Первые шаги по улучшению проекта

> Документ создан: 2025-11-17
> Для: Supabase Admin Panel v0.0.0

---

## 🚀 Quick Wins (День 1 - 4 часа)

### 1. Исправить критические проблемы безопасности

#### 1.1 Security Definer Views (30 мин)

```sql
-- Файл: supabase/migrations/YYYYMMDDHHMMSS_fix_security_definer_views.sql

-- Удалить проблемные views
DROP VIEW IF EXISTS public.embedding_statistics CASCADE;
DROP VIEW IF EXISTS public.cms_connection_stats CASCADE;

-- Пересоздать БЕЗ SECURITY DEFINER
CREATE VIEW public.embedding_statistics AS
SELECT
  tenant_id,
  COUNT(*) as total_embeddings,
  COUNT(*) FILTER (WHERE success = true) as successful_embeddings,
  COUNT(*) FILTER (WHERE success = false) as failed_embeddings,
  AVG(processing_time_ms) as avg_processing_time_ms,
  AVG(token_count) as avg_token_count,
  MIN(created_at) as first_embedding_at,
  MAX(created_at) as last_embedding_at
FROM embedding_analytics
GROUP BY tenant_id;

CREATE VIEW public.cms_connection_stats AS
SELECT
  c.id as connection_id,
  c.tenant_id,
  c.name,
  c.type,
  c.is_active,
  c.last_sync_at,
  c.last_sync_status,
  c.last_sync_count,
  COUNT(l.id) as total_syncs,
  COUNT(*) FILTER (WHERE l.status = 'success') as successful_syncs,
  COUNT(*) FILTER (WHERE l.status = 'failed') as failed_syncs,
  SUM(l.documents_synced) as total_documents_synced
FROM cms_connections c
LEFT JOIN cms_sync_logs l ON c.id = l.integration_id
GROUP BY c.id, c.tenant_id, c.name, c.type, c.is_active,
         c.last_sync_at, c.last_sync_status, c.last_sync_count;

-- Включить RLS на views (если нужно)
ALTER VIEW embedding_statistics SET (security_invoker = on);
ALTER VIEW cms_connection_stats SET (security_invoker = on);
```

**Команды**:
```bash
# Применить миграцию
supabase db push

# Или через SQL Editor в Dashboard
# Скопировать и выполнить SQL выше
```

---

#### 1.2 Переместить vector extension (15 мин)

```sql
-- Файл: supabase/migrations/YYYYMMDDHHMMSS_move_vector_extension.sql

-- Создать схему для extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- ВАЖНО: vector нельзя просто переместить!
-- Нужно пересоздать с учетом зависимостей

-- Сначала проверить зависимости
SELECT
  dependent_view.relname as view_name,
  dependent_ns.nspname as schema_name
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
WHERE pg_depend.refobjid = 'vector'::regtype;

-- ПРИМЕЧАНИЕ: vector используется в documents.embedding
-- Безопаснее оставить в public, но задокументировать
-- Пометка: LOW PRIORITY - не критично для работы
```

---

#### 1.3 Включить Password Protection & MFA (15 мин)

**Через Supabase Dashboard**:

1. **Перейти**: https://supabase.com/dashboard/project/kuxbzqpyesjdhxhnauzs/auth/policies

2. **Password Strength**:
   - ✅ Minimum password length: 8
   - ✅ Require special characters
   - ✅ Require numbers
   - ✅ Require uppercase letters

3. **Leaked Password Protection**:
   - ✅ Enable "Check passwords against HaveIBeenPwned database"

4. **Multi-Factor Authentication**:
   - Перейти: Authentication → Providers → Phone
   - ✅ Enable Phone (SMS) - если нужно
   - Перейти: Authentication → Configuration
   - ✅ Enable TOTP (Time-based One-Time Password)

**Команда (через CLI)**:
```bash
# Обновить auth config
supabase projects update --project-ref kuxbzqpyesjdhxhnauzs \
  --auth-password-required-characters=special,number,uppercase
```

---

### 2. Настроить Supabase CLI (2 часа)

#### 2.1 Установка и инициализация (30 мин)

```bash
# 1. Установить Supabase CLI глобально
npm install -g supabase

# 2. Войти в аккаунт
supabase login

# 3. Инициализировать проект
cd /home/coder/supabase-admin
supabase init

# Это создаст структуру:
# supabase/
#   ├── config.toml
#   ├── seed.sql
#   └── migrations/

# 4. Связать с облачным проектом
supabase link --project-ref kuxbzqpyesjdhxhnauzs

# 5. Получить текущие миграции из облака
supabase db pull
```

---

#### 2.2 Генерация TypeScript типов (30 мин)

```bash
# Генерация типов
supabase gen types typescript --linked > src/types/database.types.ts

# Добавить в package.json
npm pkg set scripts.types="supabase gen types typescript --linked > src/types/database.types.ts"

# Добавить в .gitignore
echo "# Supabase local development" >> .gitignore
echo "supabase/.branches" >> .gitignore
echo "supabase/.temp" >> .gitignore
```

**Создать файл использования типов**:
```typescript
// src/types/supabase.ts
import { Database } from './database.types'

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific types
export type Tenant = Tables<'tenants'>
export type Document = Tables<'documents'>
export type SearchLog = Tables<'search_logs'>
export type ApiKey = Tables<'tenant_api_keys'>
export type BillingPlan = Tables<'billing_plans'>

// Insert types
export type TenantInsert = Inserts<'tenants'>
export type DocumentInsert = Inserts<'documents'>

// Update types
export type TenantUpdate = Updates<'tenants'>
export type DocumentUpdate = Updates<'documents'>
```

---

#### 2.3 Обновить providers для использования типов (1 час)

```typescript
// src/providers/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Типизированный клиент
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
```

**Обновить использование в компонентах**:
```typescript
// src/resources/tenants/TenantList.tsx
import { Tenant } from '../../types/supabase'

// Теперь все запросы типизированы:
const { data } = await supabaseClient
  .from('tenants')
  .select('*')
// data автоматически типизирована как Tenant[]
```

---

### 3. Environment Configuration (30 мин)

```bash
# Создать файлы окружений
touch .env.local .env.development .env.staging .env.production

# .env.local (для локальной разработки с Supabase CLI)
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_TYPESENSE_HOST=localhost
VITE_TYPESENSE_PORT=8108
VITE_TYPESENSE_PROTOCOL=http
EOF

# .env.development (текущая конфигурация)
cat > .env.development << 'EOF'
VITE_SUPABASE_URL=https://kuxbzqpyesjdhxhnauzs.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_qJ_BnXTFf7WrJGPY3jLcSg_P0O2tmo8
VITE_TYPESENSE_HOST=localhost
VITE_TYPESENSE_PORT=8108
VITE_TYPESENSE_PROTOCOL=http
EOF

# Обновить .gitignore
echo "" >> .gitignore
echo "# Environment files" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.staging" >> .gitignore

# Обновить package.json
npm pkg set scripts.dev:local="vite --mode local"
npm pkg set scripts.dev:cloud="vite --mode development"
npm pkg set scripts.build:staging="vite build --mode staging"
npm pkg set scripts.build:prod="vite build --mode production"
```

---

## 📋 Checklist для Day 1

- [ ] Исправить Security Definer Views (SQL миграция)
- [ ] Включить Password Protection в Dashboard
- [ ] Включить MFA (TOTP) в Dashboard
- [ ] Установить Supabase CLI
- [ ] Инициализировать `supabase init`
- [ ] Связать проект `supabase link`
- [ ] Получить миграции `supabase db pull`
- [ ] Сгенерировать TypeScript типы
- [ ] Создать `src/types/supabase.ts` с helpers
- [ ] Обновить `supabaseClient.ts` с типами
- [ ] Создать environment файлы
- [ ] Обновить npm scripts
- [ ] Протестировать все изменения

---

## 🎯 Следующие шаги (Week 1)

### День 2-3: Real-time Subscriptions
- [ ] Создать `useRealtimeSubscription` hook
- [ ] Применить к Documents List
- [ ] Применить к Search Logs
- [ ] Применить к Tenant Usage
- [ ] Тестирование live updates

### День 4-5: Advanced Analytics
- [ ] Установить @tremor/react
- [ ] Создать Tenant Growth Chart
- [ ] Создать Search Performance Metrics
- [ ] Создать Storage Usage Trends
- [ ] API Usage Analytics

### День 6-7: Database Optimization
- [ ] Анализ медленных запросов
- [ ] Создать недостающие индексы
- [ ] Настроить query monitoring
- [ ] Performance testing

---

## 💡 Полезные команды

```bash
# Работа с миграциями
supabase migration new migration_name      # Создать новую миграцию
supabase db reset                          # Сбросить локальную БД
supabase db push                           # Применить миграции в облако
supabase db pull                           # Получить схему из облака

# Генерация типов
npm run types                              # Обновить TypeScript типы

# Локальная разработка
supabase start                             # Запустить локальный Supabase
supabase stop                              # Остановить
supabase status                            # Проверить статус

# Development
npm run dev:local                          # Vite + локальный Supabase
npm run dev:cloud                          # Vite + облачный Supabase

# Production
npm run build:staging                      # Build для staging
npm run build:prod                         # Build для production
```

---

## 📚 Документация

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [TypeScript Type Generation](https://supabase.com/docs/guides/api/rest/generating-types)
- [Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Migrations Guide](https://supabase.com/docs/guides/cli/managing-migrations)

---

## ⚠️ Важные заметки

1. **Backup перед изменениями**:
```bash
# Создать backup текущей схемы
supabase db dump -f backup_$(date +%Y%m%d).sql
```

2. **Тестирование миграций**:
```bash
# Всегда тестировать локально перед push в облако
supabase migration new test_migration
# Редактировать миграцию
supabase db reset  # Применить локально
# Если OK:
supabase db push   # Применить в облако
```

3. **Git commits**:
```bash
# Коммитить миграции отдельно
git add supabase/migrations/
git commit -m "feat: add security fixes for views"

# Коммитить типы после генерации
npm run types
git add src/types/
git commit -m "chore: regenerate database types"
```

---

## 🎉 Результаты после Day 1

После выполнения всех задач вы получите:

✅ **Безопасность**:
- Исправлены критические уязвимости
- Включена защита паролей
- Настроена MFA

✅ **Инфраструктура**:
- Локальная разработка с Supabase CLI
- Миграции в Git
- TypeScript типы из БД

✅ **Developer Experience**:
- Автокомплит для всех таблиц
- Типобезопасность
- Удобные environment configurations

✅ **Готовность к масштабированию**:
- CI/CD ready
- Версионирование схемы БД
- Production-ready setup

---

**Время выполнения**: ~4 часа
**Сложность**: 🟡 Средняя
**Impact**: 🔴 Критический

**Готовы начать? Запускайте с первого пункта!** 🚀
