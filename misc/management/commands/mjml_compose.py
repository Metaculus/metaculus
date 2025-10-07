import logging
import os
import re
import subprocess
import tempfile

from django.conf import settings
from django.core.management.base import BaseCommand
from django.template.utils import get_app_template_dirs

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

    @classmethod
    def get_template_paths(cls):
        template_dirs = []

        for path in get_app_template_dirs("templates"):
            path = str(path)

            if path.startswith(str(settings.BASE_DIR)):
                template_dirs.append(path)

        return template_dirs

    def handle(self, *args, **options):
        for templates_path in self.get_template_paths():
            if not os.path.exists(templates_path):
                continue

            for root, _, files in os.walk(templates_path):
                for file in files:
                    if file.endswith(".mjml"):
                        self.convert_mjml_to_html(os.path.join(root, file))

    def convert_mjml_to_html(self, mjml_file_path):
        with open(mjml_file_path, "r") as mjml_file:
            mjml_content = mjml_file.read()

        # Compiling final mjml file after processing mj-include
        mjml_content = process_mj_includes(
            mjml_content, os.path.dirname(mjml_file_path)
        )

        # Use direct MJML CLI instead of django-mjml to avoid stderr issues
        html_content = self.mjml_render_direct(mjml_content)

        if html_content:
            html_file_path = mjml_file_path.replace(".mjml", ".html")
            with open(html_file_path, "w") as html_file:
                html_file.write(html_content)

            logger.info(f"Converted {mjml_file_path} to {html_file_path}")
    
    def mjml_render_direct(self, mjml_content):
        """
        Render MJML content using direct CLI call to avoid django-mjml stderr issues
        """
        try:
            # Create a temporary file for the MJML content
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mjml', delete=False) as temp_file:
                temp_file.write(mjml_content)
                temp_file_path = temp_file.name
            
            try:
                # Call MJML CLI directly
                result = subprocess.run(
                    ['mjml', temp_file_path, '--stdout'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                # Remove the temp file path comment to avoid spurious diffs
                html_output = result.stdout
                # Remove lines like: <!-- FILE: /var/folders/.../tmpXXXX.mjml -->
                html_output = re.sub(
                    r'<!-- FILE: /var/folders/[^\n]+ -->\n?',
                    '',
                    html_output
                )
                return html_output
            finally:
                # Clean up temp file
                os.unlink(temp_file_path)
                
        except subprocess.CalledProcessError as e:
            logger.error(f"MJML compilation failed: {e.stderr}")
            return None
        except FileNotFoundError:
            logger.error("MJML CLI not found. Please install with: npm install -g mjml")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during MJML compilation: {e}")
            return None
