# Project structure
This is a Django + Next.js monorepo. Python/Django backend lives in the root directory, Next.js frontend lives in `front_end/`.

# Bash commands
- `npm run -C ./front_end build`: Build the project
- `npm run -C ./front_end format`: Format the frontend code
- `npm run -C ./front_end lint`: Run linter AND type checker in parallel (includes both `lint:js` and `lint:types`). Do NOT run `lint` and `lint:types` separately — `lint` already includes type checking.
- `poetry run black .`: Format Python code
- `poetry run flake8 . --exclude=front_end,.venv`: Lint Python code

# Code style
- Check the existing code style and follow it
- Destructure imports when possible (eg. import { foo } from 'bar')
- Do not use inline imports where possible. Prefer top-level imports.
- Do not add excessive comments. Add comments only to document what would be surprising to a senior engineer.
- For any frontend content visible to the user, use the translation mechanism used across the whole frontend. `const t = useTranslations()` and then `t("stringKey")` while adding the "stringKey" to all the corresponding language files in `front_end/messages/`: `en.json`, `es.json`, `cs.json`, `pt.json`, `zh.json`, `zh-TW.json`.

# Workflow
- When connected to an IDE, check terminal outputs first. If a dev server is already running, do not run a build. Instead, read the dev server terminal output for any latest errors and use those for feedback.
- When done making code changes, run the relevant linters and formatters based on which files you edited:
  - Python files: run `poetry run black .` and `poetry run flake8 . --exclude=front_end,.venv`
  - Frontend (JS/TS) files: run `npm run -C ./front_end lint` and `npm run -C ./front_end format`, and try to build with `npm run -C ./front_end build` if there is no running dev server in IDE.