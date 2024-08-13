from django.core.management.base import BaseCommand
from django.db import connections, transaction
from django.forms.models import model_to_dict
from django.core.management import call_command
from django.db.models.query import QuerySet
from django.db.models import Count, Q

from django.conf import settings
from users.models import User
from posts.models import Post, Notebook
from posts.services.feed import get_posts_feed
from questions.models import Question, GroupOfQuestions, Conditional, Forecast
from projects.models import Project
from projects.services import get_site_main_project
from scoring.models import Leaderboard


def anonymize_users(users):
    for user in users:
        user.email = f"not_real_{user.id}@locahost.local"
        user.set_password("Test1234")
        user.save()


class Command(BaseCommand):
    help = "Creates a new database and migrates a subset of data from the main database, including related objects and handling circular many-to-many relationships."

    def print(self, msg):
        self.stdout.write(self.style.SUCCESS(msg))

    def warn(self, msg):
        self.stdout.write(self.style.WARNING(msg))

    def add_arguments(self, parser):
        parser.add_argument(
            "--new_db_name",
            default="min_test_db",
            type=str,
            help="The name of the new database to be created",
        )
        parser.add_argument(
            "--drop_table",
            action="store_true",
            default=False,
            help="Drop the new table if already exists",
        )
        parser.add_argument(
            "--remove_existing",
            action="store_true",
            default=False,
            help="Remove existing objects from the new table",
        )

    def copy_objects(self, source, num_objs=None, nulify_fields=[]):
        if isinstance(source, QuerySet):
            model = source.model
            old_objects_qs = source
        else:
            model = source
            old_objects_qs = self.old_objects(model)

        model_name = model._meta.model_name

        # exclude onjects already copied
        old_objects_qs = old_objects_qs.exclude(
            pk__in=list(self.new_objects(model).values_list("id", flat=True))
        )

        old_qs = old_objects_qs[:num_objs] if num_objs is not None else old_objects_qs

        objs_to_create = []
        for old_obj in old_qs:
            for field in nulify_fields:
                setattr(old_obj, field, None)
            objs_to_create.append(old_obj)

        objs = self.new_objects(model).bulk_create(objs_to_create)

        self.print(f"Copied {len(objs)} from model <{model_name}>")

        return (objs, old_qs)

    def setup_new_database_connection(self, new_db_name, drop_existing=False):
        with connections["default"].cursor() as cursor:
            if drop_existing:
                cursor.execute(f"DROP DATABASE IF EXISTS {new_db_name}")

            cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{new_db_name}'")
            exists = cursor.fetchone()

            if not exists:
                cursor.execute(
                    f"CREATE DATABASE {new_db_name} OWNER {settings.DATABASES['default']['USER']}"
                )

        new_db_settings = settings.DATABASES["default"].copy()
        new_db_settings["NAME"] = new_db_name

        connections.databases["new_db"] = new_db_settings
        return connections["new_db"]

    def handle(self, *args, **kwargs):
        new_db_name = kwargs["new_db_name"]
        drop_table = kwargs["drop_table"]
        self.src_db = "default"
        self.dst_db = new_db_name
        self.old_objects = lambda Model: Model.objects.using("default")
        self.new_objects = lambda Model: Model.objects.using("new_db")
        remove_existing = kwargs["remove_existing"]

        # Set up the new database connection
        self.setup_new_database_connection(new_db_name, drop_table)
        call_command("migrate", database="new_db", verbosity=3)

        main_project = get_site_main_project()

        all_users = []

        if remove_existing:
            for model in [
                Post,
                Conditional,
                Question,
                GroupOfQuestions,
                Project,
                Notebook,
                User,
            ]:
                self.new_objects(model).delete()

        # Get N=200 posts queryset
        N = 200
        posts_qs_sliced = get_posts_feed(
            Post.objects.filter(default_project=main_project)
        )[:N]
        # Hack to not use sliced querysets for the remaining
        posts_qs = Post.objects.filter(pk__in=posts_qs_sliced)

        # A before copying those to the new DB:

        # - copy first their authors
        authors, _ = self.copy_objects(
            User.objects.filter(posts__in=posts_qs).distinct()
        )
        all_users += authors

        # - copy first their moderators
        moderators, _ = self.copy_objects(
            User.objects.filter(approved_questions__in=posts_qs).distinct()
        )

        all_users += moderators

        # - copy first their associated questions: simple questions, all questions appearing in conditionals
        #    but before we can do that, we need to copy first their groups
        questions_qs = Question.objects.filter(
            Q(post__in=posts_qs)
            | Q(conditional_conditions__post__in=posts_qs)
            | Q(conditional_children__post__in=posts_qs)
            | Q(conditional_yes__post__in=posts_qs)
            | Q(conditional_no__post__in=posts_qs)
        ).distinct()

        # - copy now the groups related to posts, but also related to all questions we need to copy
        groups, _ = self.copy_objects(
            GroupOfQuestions.objects.filter(
                Q(post__in=posts_qs) | Q(questions__in=questions_qs)
            ).distinct()
        )

        questions, _ = self.copy_objects(questions_qs)

        # - copy the conditionals related to the post
        conditionals, _ = self.copy_objects(
            source=Conditional.objects.filter(post__in=posts_qs).distinct(),
        )

        # - copy first also their associated projects, but before we can do that we need to first:
        projects_qs = Project.objects.filter(
            posts__in=posts_qs
            # Q(default_posts__in=posts_qs) | Q(posts__in=posts_qs)
        ).distinct()

        # copy the projects authors
        project_authors, _ = self.copy_objects(
            User.objects.filter(created_projects__in=projects_qs).distinct()
        )

        all_users += project_authors

        #  and finally now we can copy the projects associated with the posts (but by killing their primary leaderboards)
        projects, _ = self.copy_objects(
            projects_qs, num_objs=None, nulify_fields=["primary_leaderboard"]
        )

        # - copy all notebooks
        notebooks, _ = self.copy_objects(
            Notebook.objects.filter(post__in=posts_qs).distinct()
        )

        posts, _ = self.copy_objects(posts_qs)

        # Copy forecasts to the question, but before get the forecast authors
        forecasts_qs = Forecast.objects.filter(
            post__in=posts_qs, author__in=[u.id for u in all_users]
        )

        #elis: this fails because these forecasts are made on some questions which have not been copied to the new DB
        forecasts, _ = self.copy_objects(forecasts_qs)

        anonymize_users(all_users)
        print(posts)
