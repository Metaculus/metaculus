# Bash commands
- `npm run -C ./front_end build`: Build the project
- `npm run -C ./front_end format:check`: Check the frontend code formatting
- `npm run -C ./front_end format`: Format the frontend code
- `npm run -C ./front_end lint`: Run the linter on the frontend code
- `npm run -C ./front_end lint:types`: Run the type checker on the frontend code


# Code style
- Check the existing code style and follow it
- Destructure imports when possible (eg. import { foo } from 'bar')
- Do not add excesive comments. Add comments only to document what would be surprising to a senior engineer.

# Workflow
- Be sure to run the linter, type checker, formatter and try to build the code when you’re done making a series of code changes.