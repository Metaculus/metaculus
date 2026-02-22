# Bash commands
- `npm run -C ./front_end build`: Build the project
- `npm run -C ./front_end format:check`: Check the frontend code formatting
- `npm run -C ./front_end format`: Format the frontend code
- `npm run -C ./front_end lint`: Run the linter on the frontend code
- `npm run -C ./front_end lint:types`: Run the type checker on the frontend code


# Code style
- Check the existing code style and follow it
- Destructure imports when possible (eg. import { foo } from 'bar')
- Do not use inline imports where possible. Prefer top-level imports.
- Do not add excessive comments. Add comments only to document what would be surprising to a senior engineer.
- For any frontend content visible to the user, use the translation mechanism used across the whole frontend. `const t = useTranslations()` and then `t("stringKey")` while adding the "stringKey" to all the corresponding language files (en.json, es.json, etc).

# Workflow
- Be sure to run the linter, type checker, formatter and try to build the code when you’re done making a series of code changes.