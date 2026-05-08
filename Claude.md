# Project structure
This is a Django + Next.js monorepo. Python/Django backend lives in the root directory, Next.js frontend lives in `front_end/`.

# Bash commands
- `cd ./front_end && bun run build`: Build the project
- `cd ./front_end && bun run format`: Format the frontend code
- `cd ./front_end && bun run lint`: Run linter AND type checker in parallel (includes both `lint:js` and `lint:types`). Do NOT run `lint` and `lint:types` separately — `lint` already includes type checking.
- `uv run ruff format .`: Format Python code
- `uv run ruff check .`: Lint Python code

# Code style
- Check the existing code style and follow it
- Destructure imports when possible (eg. import { foo } from 'bar')
- Do not use inline imports where possible. Prefer top-level imports.
- Do not add excessive comments. Add comments only to document what would be surprising to a senior engineer.
- For any frontend content visible to the user, use the translation mechanism used across the whole frontend. `const t = useTranslations()` and then `t("stringKey")` while adding the "stringKey" to all the corresponding language files in `front_end/messages/`: `en.json`, `es.json`, `cs.json`, `pt.json`, `zh.json`, `zh-TW.json`.

# Workflow
- When connected to an IDE, check terminal outputs first. If a dev server is already running, do not run a build. Instead, read the dev server terminal output for any latest errors and use those for feedback.
- When done making code changes, run the relevant linters and formatters based on which files you edited:
  - Python files: run `uv run ruff format .` and `uv run ruff check .`
  - Frontend (JS/TS) files: run `cd ./front_end && bun run lint` and `cd ./front_end && bun run format`, and try to build with `cd ./front_end && bun run build` if there is no running dev server in IDE.