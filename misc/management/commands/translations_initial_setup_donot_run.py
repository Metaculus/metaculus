from django.core.management.base import BaseCommand, CommandParser
from django.db.models import F
from django.db import transaction

from comments.models import Comment
from posts.models import Post, Notebook
from questions.models import Question, GroupOfQuestions
from projects.models import Project


def migration_update_default_fields(model, translation_fields):
    print(f"Updating the original fields for model: {model}")
    for field_name in translation_fields:
        def_lang_fieldname = f"{field_name}_original"
        print(f"   - update data from {field_name} -> {def_lang_fieldname}")
        model.objects.update(**{def_lang_fieldname: F(field_name)})


class Command(BaseCommand):
    help = "Update the localized fields with the machine generated translations"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--dry_run",
            action="store_true",
            default=False,
            help="Dry run",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        models_to_update = [
            (Comment, ["text"]),
            (Notebook, ["markdown"]),
            (Post, ["title", "url_title"]),
            (Project, ["description", "name", "subtitle"]),
            (
                Question,
                ["description", "resolution_criteria", "fine_print", "label", "title"],
            ),
            (GroupOfQuestions, ["description", "resolution_criteria", "fine_print"]),
        ]
        for model, fields in models_to_update:
            with transaction.atomic():
                migration_update_default_fields(model, fields)
                if dry_run:
                    print("dry_run mode ON. Rollback...")
                    transaction.set_rollback(True)
