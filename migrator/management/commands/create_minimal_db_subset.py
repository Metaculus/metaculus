from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connections
from django.db.models import F, Q
from django.db.models.query import QuerySet

from comments.models import Comment
from posts.models import Notebook, Post
from posts.services.feed import get_posts_feed
from projects.models import Project
from projects.services import get_site_main_project
from questions.models import (
    Conditional,
    Forecast,
    GroupOfQuestions,
    Question,
    AggregateForecast,
)
from users.models import User


def anonymize_users(users_manager, users):
    none_fields = [
        "website",
        "twitter",
        "linkedin",
        "facebook",
        "github",
        "good_judgement_open",
        "kalshi",
        "manifold",
        "infer",
        "hypermind",
        "occupation",
        "location",
        "profile_picture",
    ]
    other_fields = ["email", "password", "username", "old_usernames"]

    for idx, user in enumerate(users):
        user.email = f"email_{idx}@locahost.local"
        user.set_password("Test1234")
        user.username = f"username_{idx}"
        user.old_usernames = []
        for field in none_fields:
            setattr(user, field, None)

    users_manager.bulk_update(users, fields=none_fields + other_fields)


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

    def copy_data(self, remove_existing):
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
                Comment,
                Forecast,
            ]:
                self.new_objects(model).delete()

        homepage_projects_qs = Project.objects.filter(
            slug__in=[
                "forecasting-Our-World-in-Data",
                "biosecurity-tournament",
                "ukraine-conflict",
                "keep-virginia-safe-ii",
            ]
        )

        homepage_notebooks_qs = Notebook.objects.filter(pk__in=[16708, 14965, 15007])

        # Get aprox N=20 posts queryset
        N = 20
        posts_qs_sliced = get_posts_feed(
            Post.objects.filter(
                default_project=main_project,
            )
        )[:N]

        posts_qs = Post.objects.filter(
            Q(
                pk__in=posts_qs_sliced
            )  # Hack to not use sliced querysets for the remaining queries
            | Q(projects__in=homepage_projects_qs)
            | Q(notebook__in=homepage_notebooks_qs)
        )

        # Include the posts also indirectly needed by the conditionals
        cond_posts_qs = posts_qs.filter(conditional__isnull=False).annotate(
            p1=F("conditional__condition__post__id"),
            p2=F("conditional__condition_child__post__id"),
            p3=F("conditional__condition__group__post__id"),
            p4=F("conditional__condition_child__group__post__id"),
        )

        posts_qs = posts_qs | Post.objects.filter(
            pk__in=list(cond_posts_qs.values_list("p1", flat=True))
            + list(cond_posts_qs.values_list("p2", flat=True))
            + list(cond_posts_qs.values_list("p3", flat=True))
            + list(cond_posts_qs.values_list("p4", flat=True))
        )

        posts_qs = posts_qs.distinct()

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

        # - copy first their associated questions: simple questions, all questions appearing in conditionals, and groups
        #    but before we can do that, we need to copy first their groups
        questions_qs = Question.objects.filter(
            Q(post__in=posts_qs)
            | Q(conditional_conditions__post__in=posts_qs)
            | Q(conditional_children__post__in=posts_qs)
            | Q(conditional_yes__post__in=posts_qs)
            | Q(conditional_no__post__in=posts_qs)
            | Q(group__post__in=posts_qs)
        ).distinct()

        # - copy now the groups related to posts, but also related to all questions we need to copy
        self.copy_objects(
            GroupOfQuestions.objects.filter(
                Q(post__in=posts_qs) | Q(questions__in=questions_qs)
            ).distinct()
        )

        self.copy_objects(questions_qs)

        # - copy the conditionals related to the post
        _, conditionals_qs = self.copy_objects(
            source=Conditional.objects.filter(post__in=posts_qs).distinct(),
        )

        # - copy first also their associated projects, but before we can do that we need to first:
        projects_qs = Project.objects.filter(
            # posts__in=posts_qs
            Q(default_posts__in=posts_qs)
            | Q(posts__in=posts_qs)
            | Q(pk__in=homepage_projects_qs)
        ).distinct()

        # copy the projects authors
        project_authors, _ = self.copy_objects(
            User.objects.filter(created_projects__in=projects_qs).distinct()
        )

        all_users += project_authors

        #  and finally now we can copy the projects associated with the posts (but by killing their primary leaderboards)
        self.copy_objects(
            projects_qs, num_objs=None, nulify_fields=["primary_leaderboard"]
        )

        # - copy all notebooks
        self.copy_objects(
            Notebook.objects.filter(
                Q(post__in=posts_qs) | Q(pk__in=homepage_projects_qs)
            ).distinct()
        )

        self.copy_objects(posts_qs)

        # handle a subset of the comments, and use the same trick to not slice the qs passed to copy_objects
        comments_qs = Comment.objects.filter(
            pk__in=(
                Comment.objects.filter(
                    Q(on_post__in=posts_qs) | Q(on_project__in=projects_qs)
                )
                .distinct()
                .order_by("pk")[:200]
            )
        )

        comment_authors, _ = self.copy_objects(
            User.objects.filter(comment__in=comments_qs).distinct()
        )
        all_users += comment_authors

        # Copy forecasts to the question, but limit it only to the existing users
        forecasts_qs = Forecast.objects.filter(
            post__in=posts_qs,
            author__in=[u.id for u in all_users],
        ).distinct()

        # Copy now the forecasts and the comments
        self.copy_objects(forecasts_qs)

        self.copy_objects(AggregateForecast.objects.filter(question__post__in=posts_qs))

        self.copy_objects(comments_qs)

        anonymize_users(self.new_objects(User), all_users)

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

        self.copy_data(remove_existing)
