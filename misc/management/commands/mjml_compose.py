import logging
import os
import re
import sys

from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.utils import get_app_template_dirs
from mjml.tools import mjml_render

logger = logging.getLogger(__name__)


def process_mj_includes(mjml_content, base_path):
    """
    Recursively processes all <mj-include> tags
    """

    include_pattern = re.compile(r'<mj-include path=["\']([^"\']+)["\']\s*/?>')

    def replace_match(match):
        # Properly resolve relative paths like ../../../templates/emails/email_top.mjml
        include_path = os.path.normpath(os.path.join(base_path, match.group(1)))
        if os.path.exists(include_path):
            with open(include_path, "r") as file:
                include_content = file.read()
            return process_mj_includes(include_content, os.path.dirname(include_path))
        else:
            raise FileNotFoundError(f"Included file {include_path} not found.")

    while include_pattern.search(mjml_content):
        mjml_content = include_pattern.sub(replace_match, mjml_content)

    return mjml_content


class Command(BaseCommand):
    help = "Composes MJML files to HTML"

    def add_arguments(self, parser):
        parser.add_argument(
            "--check",
            action="store_true",
            help="Check that all MJML-compiled HTML files are up to date.",
        )

    @classmethod
    def get_template_paths(cls):
        template_dirs = []

        for path in get_app_template_dirs("templates"):
            path = str(path)

            if path.startswith(str(settings.BASE_DIR)):
                template_dirs.append(path)

        return template_dirs

    def handle(self, *args, **options):
        self.check_mode = options["check"]
        self.stale_files = []

        for templates_path in self.get_template_paths():
            if not os.path.exists(templates_path):
                continue

            for root, _, files in os.walk(templates_path):
                for file in files:
                    if file.endswith(".mjml"):
                        self.convert_mjml_to_html(os.path.join(root, file))

        if self.check_mode and self.stale_files:
            self.stderr.write(
                "The following MJML-compiled HTML files are out of date:\n"
            )
            for path in self.stale_files:
                self.stderr.write(f"  {path}\n")
            self.stderr.write(
                "\nRun 'python manage.py mjml_compose' to rebuild them.\n"
            )
            sys.exit(1)

    def convert_mjml_to_html(self, mjml_file_path):
        with open(mjml_file_path, "r") as mjml_file:
            mjml_content = mjml_file.read()

        # Compiling final mjml file after processing mj-include
        mjml_content = process_mj_includes(
            mjml_content, os.path.dirname(mjml_file_path)
        )

        html_content = mjml_render(mjml_content)

        if html_content:
            html_file_path = mjml_file_path.replace(".mjml", ".html")

            if self.check_mode:
                existing = ""
                if os.path.exists(html_file_path):
                    with open(html_file_path, "r") as f:
                        existing = f.read()
                if existing != html_content:
                    self.stale_files.append(html_file_path)
                return

            with open(html_file_path, "w") as html_file:
                html_file.write(html_content)

            logger.info(f"Converted {mjml_file_path} to {html_file_path}")
