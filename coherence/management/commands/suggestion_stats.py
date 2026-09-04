"""
Print AI-suggestions observability stats.

Usage:
    python manage.py suggestion_stats
"""

import json

from django.core.management.base import BaseCommand

from coherence.services.suggestions.stats import overview_stats


class Command(BaseCommand):
    help = "Print AI-link-suggestions observability stats."

    def handle(self, *args, **options):
        self.stdout.write(json.dumps(overview_stats(), indent=2))
