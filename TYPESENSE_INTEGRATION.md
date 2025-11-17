# Typesense Integration Guide

Этот документ описывает интеграцию Typesense в проект Supabase Admin Panel.

## 📋 GitHub Issues

Все задачи по интеграции Typesense созданы в GitHub Issues:

**Родительский Issue**: [#6 - Integrate Typesense Admin Interface](https://github.com/AAChibilyaev/supabase-saas-admin/issues/6)

### Список всех задач

#### 🔧 Настройка
- [#7 - Setup: Install Typesense Dependencies and Configuration](https://github.com/AAChibilyaev/supabase-saas-admin/issues/7)

#### 📚 Основные ресурсы
- [#8 - Collections Management - CRUD Interface](https://github.com/AAChibilyaev/supabase-saas-admin/issues/8)
- [#9 - Documents Management - CRUD Interface](https://github.com/AAChibilyaev/supabase-saas-admin/issues/9)
- [#16 - Collection Aliases Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/16)

#### 🔍 Поисковые функции
- [#10 - Multi-Search Interface](https://github.com/AAChibilyaev/supabase-saas-admin/issues/10)
- [#19 - Natural Language Search Models](https://github.com/AAChibilyaev/supabase-saas-admin/issues/19)
- [#20 - Conversation Models (RAG)](https://github.com/AAChibilyaev/supabase-saas-admin/issues/20)

#### ⚙️ Улучшение поиска
- [#12 - Synonyms Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/12)
- [#13 - Curation Sets Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/13)
- [#14 - Stopwords Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/14)
- [#15 - Presets Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/15)
- [#21 - Stemming Dictionaries](https://github.com/AAChibilyaev/supabase-saas-admin/issues/21)

#### 🔑 Безопасность
- [#11 - API Keys Management](https://github.com/AAChibilyaev/supabase-saas-admin/issues/11)

#### 📊 Аналитика и мониторинг
- [#17 - Analytics Dashboard](https://github.com/AAChibilyaev/supabase-saas-admin/issues/17)
- [#18 - System Operations & Monitoring](https://github.com/AAChibilyaev/supabase-saas-admin/issues/18)

## 🎯 План реализации

### Фаза 1: Базовая настройка (Issue #7)
1. Установить зависимости
2. Настроить Typesense клиент
3. Создать data provider
4. Создать composite data provider

### Фаза 2: Основные ресурсы (Issues #8, #9, #16)
1. Collections Management
2. Documents Management
3. Collection Aliases

### Фаза 3: Поиск (Issues #10, #19, #20)
1. Multi-Search Interface
2. NL Search Models
3. Conversation Models

### Фаза 4: Улучшения (Issues #12-15, #21)
1. Synonyms
2. Curations
3. Stopwords
4. Presets
5. Stemming Dictionaries

### Фаза 5: Безопасность и мониторинг (Issues #11, #17, #18)
1. API Keys Management
2. Analytics Dashboard
3. System Monitoring

## 🔗 Полезные ссылки

- [Typesense API Documentation](https://typesense.org/docs/api/)
- [OpenAPI Specification](https://raw.githubusercontent.com/typesense/typesense-api-spec/refs/heads/master/openapi.yml)
- [React Admin Documentation](https://marmelab.com/react-admin/)
- [React Admin Data Providers](https://marmelab.com/react-admin/DataProviderList.html)

## 📚 Ресурсы из OpenAPI спецификации

### Collections API
- `GET /collections` - Список всех коллекций
- `POST /collections` - Создать коллекцию
- `GET /collections/{name}` - Получить коллекцию
- `PATCH /collections/{name}` - Обновить коллекцию
- `DELETE /collections/{name}` - Удалить коллекцию

### Documents API
- `POST /collections/{name}/documents` - Индексировать документ
- `GET /collections/{name}/documents/search` - Поиск документов
- `GET /collections/{name}/documents/export` - Экспорт документов
- `POST /collections/{name}/documents/import` - Импорт документов (JSONL)
- `GET /collections/{name}/documents/{id}` - Получить документ
- `PATCH /collections/{name}/documents/{id}` - Обновить документ
- `DELETE /collections/{name}/documents/{id}` - Удалить документ

### Search API
- `POST /multi_search` - Множественный поиск

### Synonyms API
- `GET /synonym_sets` - Список наборов синонимов
- `PUT /synonym_sets/{name}` - Создать/обновить набор
- `DELETE /synonym_sets/{name}` - Удалить набор

### API Keys
- `GET /keys` - Список ключей
- `POST /keys` - Создать ключ
- `DELETE /keys/{id}` - Удалить ключ

### Analytics
- `POST /analytics/events` - Создать событие
- `GET /analytics/events` - Получить события
- `GET /analytics/rules` - Получить правила аналитики

### System
- `GET /health` - Статус здоровья сервера
- `GET /metrics.json` - Метрики (RAM, CPU, Disk)
- `GET /stats.json` - Статистика API

## 🚀 Быстрый старт

### 1. Установите Typesense сервер

```bash
# Docker
docker run -p 8108:8108 -v/tmp/data:/data typesense/typesense:26.0 \
  --data-dir /data --api-key=xyz --enable-cors
```

### 2. Настройте переменные окружения

Добавьте в `.env`:

```env
VITE_TYPESENSE_URL=http://localhost:8108
VITE_TYPESENSE_API_KEY=xyz
```

### 3. Установите зависимости

```bash
npm install typesense query-string
```

### 4. Следуйте задачам в GitHub Issues

Начните с [Issue #7](https://github.com/AAChibilyaev/supabase-saas-admin/issues/7) для базовой настройки.

## 💡 Архитектура интеграции

```
src/
├── providers/
│   ├── supabaseClient.ts         # Существующий Supabase клиент
│   ├── dataProvider.ts           # Существующий Supabase data provider
│   ├── typesenseClient.ts        # ✨ НОВЫЙ: Typesense клиент
│   ├── typesenseDataProvider.ts  # ✨ НОВЫЙ: Typesense data provider
│   └── compositeDataProvider.ts  # ✨ НОВЫЙ: Комбинированный provider
├── resources/
│   ├── tenants/                  # Существующие ресурсы
│   ├── documents/
│   ├── typesense-collections/    # ✨ НОВЫЙ: Typesense коллекции
│   ├── typesense-documents/      # ✨ НОВЫЙ: Typesense документы
│   ├── typesense-search/         # ✨ НОВЫЙ: Поиск
│   ├── typesense-api-keys/       # ✨ НОВЫЙ: API ключи
│   ├── typesense-synonyms/       # ✨ НОВЫЙ: Синонимы
│   ├── typesense-analytics/      # ✨ НОВЫЙ: Аналитика
│   └── typesense-system/         # ✨ НОВЫЙ: Система
└── App.tsx                       # Обновить с новыми ресурсами
```

## 🤝 Как работать с issues

1. Выберите issue для работы
2. Создайте ветку: `git checkout -b feature/issue-N-description`
3. Реализуйте функционал согласно Acceptance Criteria
4. Создайте Pull Request
5. Свяжите PR с issue (используя `Closes #N`)

## 📝 Примечания

- Все компоненты используют shadcn/ui для консистентного UI
- Следуйте существующей структуре ресурсов
- Используйте TypeScript для типобезопасности
- Добавляйте тесты для критических функций
- Документируйте сложные части кода

## 🎨 Стилистика кода

- Используйте существующие shadcn/ui компоненты
- Следуйте паттернам React Admin
- Применяйте React hooks для состояния
- Используйте TypeScript types и interfaces

## ✅ Checklist перед PR

- [ ] Код следует существующему стилю
- [ ] Все Acceptance Criteria выполнены
- [ ] Добавлены необходимые типы TypeScript
- [ ] UI консистентен с остальным приложением
- [ ] Код работает без ошибок
- [ ] Добавлена документация (если нужно)

---

**Готовы начать?** Переходите к [Issue #7](https://github.com/AAChibilyaev/supabase-saas-admin/issues/7)!
