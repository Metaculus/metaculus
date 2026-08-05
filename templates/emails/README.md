# Overview

We use [mjml](mjml.io) for writing responsive e-mails, and that does about 80% of the job (see the Limitations section).

We compile MJML to HTML and use the compiled HTML as Django templates. The `.html` files are build artifacts: they are
gitignored, produced by the `email_templates` Dockerfile stage for deployed images, and never edited by hand.

This is how we compile all `metac_question` email templates locally:

1. Install [mjml](https://mjml.io/) at the version in the Dockerfile's `ARG MJML_VERSION`: `bun add -g mjml@5.4.0`
2. Compose mjml templates in django apps: `uv run python manage.py mjml_compose`

Run step 2 after a fresh clone as well — without it the email templates do not exist yet. The command fails on MJML
errors and on compiled HTML that no longer parses as a Django template, and CI runs it on every PR.

## Limitations

- Django template tags are not preserved outside of
  [ending tags](https://documentation.mjml.io/#ending-tags). We use `mj-raw` if
  other ending tags are not suitable.
- You can use the `css-class` mjml attribute to add a CSS class to your elements, but the class is
  added to the top element, which often is a <td> that contains a table that contains your element.
  MJML heavily relies on tables to make the emails responsive, so you need to account for that in
  your CSS and make sure you use the right CSS selector to target your specific element (use the
  `/ui/email-preview/` page for debugging).
