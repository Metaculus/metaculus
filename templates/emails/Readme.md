# Overview

We use [mjml](mjml.io) for writing responsive e-mails, and that does about 80% of the job (see the Limitations section).

We compile MJML to HTML once, when we change the e-mails, and then use the compiled HTML as Django templates (we even save these to git, but we don't modify manually).

This is how we compile all `metac_question` email templates:

1. Install [mjml](https://mjml.io/): `npm i -g mjml`
2. Compose mjml templates in django apps: `python manage.py mjml_compose`

## Limitations

- Django template tags are not preserved outside of
  [ending tags](https://documentation.mjml.io/#ending-tags). We use `mj-raw` if
  other ending tags are not suitable.
- You can use the `css-class` mjml attribute to add a CSS class to your elements, but the class is
  added to the top element, which often is a <td> that contains a table that contains your element.
  MJML heavily relies on tables to make the emails responsive, so you need to account for that in
  your CSS and make sure you use the right CSS selector to target your specific element (use the
  `/ui/email-preview/` page for debugging).
