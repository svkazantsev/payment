# Формат правил Cursor

Источник: https://cursor.com/docs/rules (проверено 2026-10).

- Проектные правила лежат в `.cursor/rules/` как файлы `.mdc`, версионируются в git.
- Файл = YAML frontmatter + Markdown. Поля frontmatter: `description`, `globs`, `alwaysApply`.
- Типы:
  - Always Apply: `alwaysApply: true` — в каждом чате, `globs` и `description` игнорируются.
  - Apply to Specific Files: `globs` (через запятую) — подключается, когда в контексте файл по маске.
  - Apply Intelligently: только `description` — агент сам решает по описанию.
  - Manual: без всего — подключается через `@имя-правила`.
- Альтернатива/дополнение: `AGENTS.md` в корне (простой Markdown, грузится всегда).

Рекомендации для платёжного пакета:
- `payments-core.mdc` — `description` + `globs` на платёжные папки (не `alwaysApply`, чтобы не засорять контекст в остальных задачах).
- Каждое правило — короткое (до ~500 строк), императивные пункты, ссылки на файлы проекта через `@file`.
- Код-образцы в правилах — только проверенные (из `assets/snippets/`).
