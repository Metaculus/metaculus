import logging
import pickle
from typing import Union, Any, Callable

from django.db import models, transaction, IntegrityError
from django.db.models import QuerySet
from django.utils.translation import activate
from rest_framework.authtoken.models import Token
from social_django.models import Partial, UserSocialAuth

from comments.models import Comment, CommentVote
from community_migration.utils import (
    sync_comment_counters,
    normalize_comment_edition_date,
    sync_post_counters,
    extract_label_from_question,
)
from posts.models import Notebook, Post, Vote, PostUserSnapshot, PostSubscription
from projects.models import Project, ProjectSubscription, ProjectUserPermission
from questions.models import Question, GroupOfQuestions, Conditional, Forecast
from questions.services import build_question_forecasts
from users.models import User

FORPOL_DB = "forpol"

logger = logging.getLogger(__name__)

OLD_MAIN_PROJECT_ID = 2391
project_main = Project.objects.get(pk=32765)
project_storage = Project.objects.get(pk=32768)


class MigrationMappingRegistry:
    """
    Registry between Old and New instances mapping
    """

    def __init__(self):
        self._registry = {}

    def add(self, old_id: int, new_instance: models.Model):
        model = new_instance.__class__

        if model not in self._registry:
            self._registry[model] = {}

        self._registry[new_instance.__class__][old_id] = new_instance

    def get_by_id(self, model: type[models.Model], pk: int):
        if pk is None:
            return

        # Return as is if registry does not exist
        if model not in self._registry:
            return pk

        return self._registry[model][pk].id

    def get_for_model(self, model: type[models.Model]):
        return self._registry[model]

    def get_qs_for_model(self, model: type[models.Model]):
        return model.objects.filter(
            pk__in=[x.id for x in self._registry[model].values()]
        )


registry = MigrationMappingRegistry()


def model_instance_to_dict(obj: models.Model, exclude: list[str] = None):
    exclude = set(exclude or [])
    data: dict[str, Any] = {}

    for f in obj.__class__._meta.get_fields():
        # skip non-concrete fields and M2M
        if not f.concrete or f.many_to_many:
            continue

        # skip excluded names (for FK we compare against f.name, not attname)
        if f.name in exclude:
            continue

        # Skip _cs translated fields
        if f.name.endswith("_original"):
            original_field = f.name.removesuffix("_original")

            if hasattr(obj, original_field):
                data[f.name] = getattr(obj, original_field)

            continue

        # handle ForeignKey
        if f.is_relation and f.is_relation:
            related_model = f.remote_field.model
            data[f.attname] = registry.get_by_id(related_model, getattr(obj, f.attname))
        else:
            data[f.name] = getattr(obj, f.name)

    return data


def migrate_table(
    qs: type[models.Model] | QuerySet,
    exclude: list[str] = None,
    extra: dict[str, Union[Any, Callable[[models.Model], Any]]] = None,
    ignore_conflicts: bool = False,
    generate_id_on_failure: bool = False,
    skip_failed_registry_lookup: bool = False,
):
    if not isinstance(qs, QuerySet):
        qs = qs.objects

    extra = extra or {}

    # pull all old instances
    old_qs = qs.using(FORPOL_DB).all()
    model = old_qs.model
    prepared_data = []

    for old_obj in old_qs:
        # base data from the old object
        try:
            data = model_instance_to_dict(old_obj, exclude=exclude)
        except KeyError:
            if skip_failed_registry_lookup:
                continue

            raise

        # apply extras, call if needed
        for field_name, val_or_callable in extra.items():
            if callable(val_or_callable):
                data[field_name] = val_or_callable(old_obj)
            else:
                data[field_name] = val_or_callable

        prepared_data.append(data)

    if generate_id_on_failure:
        for data in prepared_data:
            if generate_id_on_failure:
                # create & save new instance
                old_id = data.get("id")

                try:
                    # Some forpol objects were created after Rewrite release
                    # So there are already collisions with Forpol & Rewrite instance Primary Keys
                    # This is an attempt to keep old ids wherever it's possible
                    with transaction.atomic():
                        new_obj = model.objects.create(**data)
                except IntegrityError:
                    if ignore_conflicts:
                        continue
                    elif not generate_id_on_failure or not old_id:
                        raise

                    # TODO: check collisions in the DB
                    # Autogenerate id then :(
                    new_obj = model.objects.create(**{**data, "id": None})
                    logger.warning(
                        f"{model} ID {old_id} collision. New ID: {new_obj.id}"
                    )

                if old_id and generate_id_on_failure:
                    registry.add(old_id, new_obj)
    else:
        model.objects.bulk_create(
            [model(**data) for data in prepared_data], ignore_conflicts=ignore_conflicts
        )


def migrate_users():
    logger.info("Migrating users...")

    for old_user in User.objects.using(FORPOL_DB).all():
        data = model_instance_to_dict(old_user)

        if new_user := User.objects.filter(username=data["username"]).first():
            registry.add(old_user.id, new_user)

            continue

        data = {**data, "is_staff": False, "is_superuser": False}

        try:
            with transaction.atomic():
                new_user = User.objects.create(**data)
        except IntegrityError as exc:
            # Autogenerate id then :(
            new_user = User.objects.create(**{**data, "id": None})
            logger.warning(f"User ID {old_user.id} collision. New ID: {new_user.id}")

        registry.add(old_user.id, new_user)

    migrate_table(Token, exclude=["id"])
    migrate_table(Partial, exclude=["id"])
    migrate_table(UserSocialAuth, exclude=["id"])


def migrate_projects():
    logger.info("Migrating Projects...")

    # Don't migrate projects
    # Map to the new entities instead
    for project in Project.objects.using(FORPOL_DB).filter(
        type__in=[
            Project.ProjectTypes.SITE_MAIN,
            Project.ProjectTypes.TOURNAMENT,
            Project.ProjectTypes.QUESTION_SERIES,
        ]
    ):
        new_obj = project_storage

        if project.id == OLD_MAIN_PROJECT_ID:
            new_obj = project_main

        # Old ID -> New Obj map!
        registry.add(project.id, new_obj)

    # Migrate permissions
    migrate_table(
        ProjectUserPermission,
        exclude=["id"],
        skip_failed_registry_lookup=True,
        ignore_conflicts=True,
    )
    migrate_table(
        ProjectSubscription,
        exclude=["id"],
        skip_failed_registry_lookup=True,
    )


def migrate_posts():
    logger.info("Migrating Posts...")

    migrate_table(
        Notebook
    )
    migrate_table(
        GroupOfQuestions
    )

    # migrate questions
    old_questions_map = {}

    # Some forpol questions were created after Rewrite release
    # So there are already collisions with Forpol & Rewrite instance Primary Keys
    # This is an attempt to keep old ids wherever it's possible
    migrate_table(Question, generate_id_on_failure=True)

    migrate_table(Conditional)

    old_posts_map = {}

    for old_post in Post.objects.using(FORPOL_DB).all():
        title = old_post.title

        if old_post.default_project_id != OLD_MAIN_PROJECT_ID:
            # Append project prefix
            title = f"{title} [{old_post.default_project.name}]"

        data = {
            **model_instance_to_dict(old_post),
            "title": title,
            "title_original": title,
        }

        try:
            with transaction.atomic():
                new_post = Post.objects.create(**data)
        except IntegrityError:
            # Autogenerate id then :(
            new_post = Post.objects.create(**{**data, "id": None})
            logger.warning(f"Post ID {old_post.id} collision. New ID: {new_post.id}")

        registry.add(old_post.id, new_post)

    # Migrate secondary projects
    migrate_table(
        Post.projects.through, exclude=["id"], skip_failed_registry_lookup=True
    )
    # Migrate votes
    migrate_table(Vote, exclude=["id"])
    migrate_table(PostUserSnapshot, exclude=["id"])
    migrate_table(PostSubscription, exclude=["id"])

    return (
        Post.objects.filter(id__in=[x.id for x in old_posts_map.values()]),
        old_posts_map,
        old_questions_map,
    )


def migrate_comments():
    logger.info("Migrating Comments...")

    migrate_table(
        Comment.objects.using(FORPOL_DB).order_by("created_at"),
        generate_id_on_failure=True,
    )
    migrate_table(CommentVote, exclude=["id"])

    normalize_comment_edition_date(registry.get_qs_for_model(Comment))


def after_migrate():
    logger.info("Applying final adjustments")

    posts_qs = Post.objects.filter(
        pk__in=[x.id for x in registry.get_for_model(Post).values()]
    ).prefetch_questions()

    sync_comment_counters(PostUserSnapshot.objects.filter(post__in=posts_qs))
    sync_post_counters(posts_qs)

    for post in posts_qs:
        for question in post.get_questions():
            try:
                build_question_forecasts(question)
            except Exception:
                logger.exception(
                    "Failed to generate forecast for question %s", question.id
                )

            if question.group_id:
                label = extract_label_from_question(question)
                question.label = question.label_original = label
                question.save()

        # Ensure we don't duplicate default_project in Post.projects
        post.projects.set(
            [
                project
                for project in post.projects.all()
                if project.id != post.default_project_id
            ]
        )


def export_migration_log():
    with open("migration_registry.pickle", "wb") as f:
        pickle.dump(registry, f)


@transaction.atomic
def migrate():
    # Activate Czech as original language of the content
    activate("cs")

    # Users
    migrate_users()

    migrate_projects()

    # Migrate posts
    migrate_posts()

    migrate_table(Forecast, exclude=["id"])

    migrate_comments()

    after_migrate()

    # TODO: should we reset sequence?

    export_migration_log()

    raise Exception("Finished!")


# TODO:
#   - Use latest old-prod database, not backup!
#   - Generate question vectors!
#   - Generate leaderboards/What to do with them?
#   - Ensure no migrated objects actually use Project relation to ensure they won't use old IDs that now represent new entities in prod db
#   - TODO: should we convert community Forecasters to Community Subscribers?
#   - TODO: trigger trigger_update_post_translations for newly created posts.
