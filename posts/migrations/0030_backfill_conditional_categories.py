from django.db import migrations


def backfill_conditional_categories(apps, schema_editor):
    """
    Populate categories on conditional posts from their condition
    and condition_child posts.
    """
    Post = apps.get_model("posts", "Post")

    category_type = "category"

    conditional_posts = (
        Post.objects.filter(conditional__isnull=False)
        .select_related(
            "conditional__condition__post",
            "conditional__condition_child__post",
        )
        .iterator()
    )

    for post in conditional_posts:
        conditional = post.conditional
        categories_to_add = set()

        condition_post = conditional.condition.post
        if condition_post:
            categories_to_add.update(
                condition_post.projects.filter(type=category_type)
            )

        child_post = conditional.condition_child.post
        if child_post:
            categories_to_add.update(
                child_post.projects.filter(type=category_type)
            )

        if categories_to_add:
            post.projects.add(*categories_to_add)


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0029_remove_notebook_markdown_summary_and_more"),
        ("projects", "0021_projectindex_project_index_projectindexpost"),
    ]

    operations = [
        migrations.RunPython(
            backfill_conditional_categories,
            migrations.RunPython.noop,
        ),
    ]
