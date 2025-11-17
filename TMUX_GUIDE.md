# 🚀 TMUX Guide for Supabase Admin Development

## Quick Start

### Method 1: Interactive Launcher
```bash
tm
# or
~/tmux-start.sh
```
Откроется интерактивное меню с опциями.

### Method 2: Direct Project Launch
```bash
tms
# or
cd ~/supabase-admin && ./.tmux-dev.sh
```
Сразу запустит полноценную dev-сессию для Supabase Admin.

## Development Session Layout

Скрипт `.tmux-dev.sh` создает 7 окон:

### Window 1: `editor` 📝
Основное рабочее пространство для редактирования кода
```bash
# Откройте ваш редактор
vim src/App.tsx
# или
code .
```

### Window 2: `dev-server` 🔥
Автоматически запускает Vite dev server
- URL: http://localhost:5173
- Hot Module Replacement включен
- Автоматическая перезагрузка при изменениях

### Window 3: `build` 🔨
Разделен на 2 панели:
- **Левая**: Команды сборки
  - `npm run build` - Production build
  - `npm run preview` - Preview build
- **Правая**: Linting
  - `npm run lint` - Проверка кода

### Window 4: `git-db` 📊
Разделен на 2 панели:
- **Верхняя**: Git операции
  - `git status`, `git add`, `git commit`, `git push`
- **Нижняя**: Supabase операции
  - `supabase status`
  - `supabase db reset`

### Window 5: `logs` 📋
Разделен на 4 панели для мониторинга:
- Application logs
- Network monitoring
- System resources
- Services status

### Window 6: `tests` 🧪
Запуск тестов
```bash
npm test
npm run test:watch
```

### Window 7: `terminal` 💻
Универсальный терминал для любых команд

## Custom Keyboard Shortcuts

### Navigation (без префикса)
- `Alt + Arrows` - Переключение между панелями
- `Shift + Arrows` - Переключение между окнами

### Prefix Commands (Ctrl+a + клавиша)

#### Window Management
- `Ctrl+a c` - Новое окно
- `Ctrl+a ,` - Переименовать окно
- `Ctrl+a n/p` - След./пред. окно
- `Ctrl+a 0-9` - Перейти к окну N
- `Ctrl+a X` - Закрыть окно

#### Pane Management
- `Ctrl+a |` - Разделить по вертикали
- `Ctrl+a -` - Разделить по горизонтали
- `Ctrl+a h/j/k/l` - Vim-навигация между панелями
- `Ctrl+a H/J/K/L` - Изменить размер панели
- `Ctrl+a x` - Закрыть панель
- `Ctrl+a z` - Zoom панели (на весь экран и обратно)

#### Project-Specific Shortcuts ⚡
- `Ctrl+a N` - Запустить `npm run dev` в новой панели
- `Ctrl+a B` - Запустить `npm run build` в новой панели
- `Ctrl+a L` - Запустить `npm run lint` в новой панели
- `Ctrl+a T` - Запустить `npm test` в новой панели
- `Ctrl+a G` - Git status в новой панели
- `Ctrl+a D` - Git diff в новой панели
- `Ctrl+a P` - Git pull в новой панели
- `Ctrl+a S` - Создать dev layout (3 панели)
- `Ctrl+a F` - Открыть файл (prompt)

#### Copy Mode
- `Ctrl+a [` - Войти в режим копирования
- `Space` - Начать выделение
- `Enter` - Скопировать
- `Ctrl+a ]` - Вставить
- `q` - Выйти из режима

#### Session Management
- `Ctrl+a d` - Отключиться от сессии
- `Ctrl+a C-c` - Создать новую сессию
- `Ctrl+a C-f` - Найти сессию

#### Utility
- `Ctrl+a r` - Перезагрузить конфиг
- `Ctrl+a ?` - Показать все shortcuts
- `Ctrl+a C-l` - Очистить экран и историю

## Shell Aliases

Добавлены в `~/.bash_aliases`:

### TMUX
- `tm` - Интерактивный launcher
- `tms` - Быстрый старт Supabase Admin
- `tl` - Список сессий
- `ta <name>` - Подключиться к сессии
- `tn <name>` - Создать новую сессию
- `tk <name>` - Убить сессию

### Development
- `dev` - `npm run dev`
- `build` - `npm run build`
- `lint` - `npm run lint`

### Navigation
- `cdsa` - `cd ~/supabase-admin`

### Config
- `tmux-reload` - Перезагрузить конфиг
- `tmux-config` - Редактировать конфиг

## Workflow Examples

### Starting a Development Session

```bash
# Вариант 1: Интерактивный
tm

# Вариант 2: Прямой запуск
tms

# В сессии:
# Window 1 (editor): Откройте код
# Window 2 (dev-server): Уже работает на :5173
# Window 3 (build): Запустите lint при необходимости
# Window 4 (git-db): Git операции
```

### Working with Multiple Panes

```bash
# В любом окне
Ctrl+a |    # Разделить вертикально
Ctrl+a -    # Разделить горизонтально

# Навигация
Alt+Arrows  # Быстрое переключение

# Ресайз
Ctrl+a H/J/K/L
```

### Quick NPM Commands

```bash
# Находясь в любой панели
Ctrl+a N    # Новая панель с npm run dev
Ctrl+a B    # Новая панель с npm run build
Ctrl+a L    # Новая панель с npm run lint
```

### Git Workflow

```bash
# Перейти в окно git-db (4)
Ctrl+a 4

# Или запустить в текущей панели
Ctrl+a G    # Git status
Ctrl+a D    # Git diff
Ctrl+a P    # Git pull
```

### Detaching and Reattaching

```bash
# Отключиться (сессия продолжает работать)
Ctrl+a d

# Вернуться позже
ta supabase-admin
# или
tms
```

## Tips & Tricks

### 1. Mouse Support
✓ Мышь полностью поддерживается:
- Клик для выбора панели
- Перетаскивание границ для ресайза
- Скролл для прокрутки
- Клик по имени окна для переключения

### 2. Copy-Paste
```bash
# Метод 1: Мышью
# Выделите текст мышью, он автоматически скопируется в clipboard

# Метод 2: Keyboard
Ctrl+a [        # Войти в copy mode
Space           # Начать выделение (vi-mode)
Enter           # Скопировать
Ctrl+a ]        # Вставить
```

### 3. Search in Scrollback
```bash
Ctrl+a [        # Войти в copy mode
Ctrl+r          # Поиск назад
Ctrl+s          # Поиск вперед
```

### 4. Zoom Pane
```bash
Ctrl+a z        # Развернуть панель на весь экран
Ctrl+a z        # Вернуть обратно
```

### 5. Swap Panes
```bash
Ctrl+a {        # Поменять с предыдущей
Ctrl+a }        # Поменять со следующей
```

### 6. Synchronize Panes
```bash
# В окне с несколькими панелями
Ctrl+a :
setw synchronize-panes on

# Теперь команды выполняются во всех панелях
# Отключить:
setw synchronize-panes off
```

### 7. Rename Window
```bash
Ctrl+a ,        # Переименовать текущее окно
# Введите новое имя
```

## Troubleshooting

### Session не запускается
```bash
# Проверьте, что скрипт исполняемый
chmod +x ~/supabase-admin/.tmux-dev.sh
chmod +x ~/tmux-start.sh
```

### Конфиг не применяется
```bash
# Перезагрузите конфиг
Ctrl+a r
# или
tmux source-file ~/.tmux.conf
```

### Clipboard не работает
```bash
# Используйте мышь для копирования
# Или проверьте, что pbcopy доступен (macOS)
which pbcopy
```

### Цвета выглядят неправильно
```bash
# Проверьте TERM
echo $TERM
# Должно быть tmux-256color

# Если нет, добавьте в ~/.bashrc:
export TERM=tmux-256color
```

## Advanced Usage

### Custom Session Script
Создайте свой собственный скрипт для другого проекта:

```bash
# Скопируйте шаблон
cp ~/supabase-admin/.tmux-dev.sh ~/my-project/.tmux-dev.sh

# Отредактируйте
vim ~/my-project/.tmux-dev.sh

# Измените SESSION_NAME и PROJECT_DIR
# Настройте окна под ваш проект
```

### Save Session State (with TPM)
```bash
# Установите TPM (раскомментируйте в ~/.tmux.conf)
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# Добавьте плагины в ~/.tmux.conf:
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# Перезагрузите tmux
Ctrl+a r

# Установите плагины
Ctrl+a I

# Сохранение/восстановление будет автоматическим
```

## Resources

- **Config**: `~/.tmux.conf`
- **Dev Script**: `~/supabase-admin/.tmux-dev.sh`
- **Launcher**: `~/tmux-start.sh`
- **Aliases**: `~/.bash_aliases`
- **Cheatsheet**: `~/tmux-cheatsheet.md`

## Keyboard Shortcuts Cheatsheet

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Prefix** | `Ctrl+a` | Command prefix |
| **Navigation** | | |
| Switch pane | `Alt+Arrows` | No prefix needed |
| Switch window | `Shift+Arrows` | No prefix needed |
| Vim navigation | `Ctrl+a h/j/k/l` | Vim-style |
| **Panes** | | |
| Split horizontal | `Ctrl+a \|` | Create vertical pane |
| Split vertical | `Ctrl+a -` | Create horizontal pane |
| Close pane | `Ctrl+a x` | No confirmation |
| Zoom pane | `Ctrl+a z` | Toggle fullscreen |
| **Windows** | | |
| New window | `Ctrl+a c` | In current dir |
| Close window | `Ctrl+a X` | No confirmation |
| Rename | `Ctrl+a ,` | Type new name |
| **Development** | | |
| Run dev | `Ctrl+a N` | npm run dev |
| Build | `Ctrl+a B` | npm run build |
| Lint | `Ctrl+a L` | npm run lint |
| Test | `Ctrl+a T` | npm test |
| **Git** | | |
| Status | `Ctrl+a G` | git status |
| Diff | `Ctrl+a D` | git diff |
| Pull | `Ctrl+a P` | git pull |
| **Session** | | |
| Detach | `Ctrl+a d` | Keep running |
| New session | `Ctrl+a C-c` | Create new |
| **Utility** | | |
| Reload config | `Ctrl+a r` | Apply changes |
| Help | `Ctrl+a ?` | All bindings |
| Clear | `Ctrl+a C-l` | Clear history |

---

**Happy coding with tmux!** 🚀
