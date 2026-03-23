from django.db import migrations


def backfill_conditional_categories(apps, schema_editor):
    """
    Populate categories on conditional posts from their condition
    and condition_child posts.
    """
    Post = apps.get_model("posts", "Post")

    category_type = "category"

    conditional_posts = Post.objects.filter(
        conditional__isnull=False,
    ).select_related(
        "conditional__condition",
        "conditional__condition_child",
    )

    for post in conditional_posts:
        conditional = post.conditional
        categories_to_add = set()

        # Get categories from condition's post
        condition_post_id = conditional.condition.post_id
        if condition_post_id:
            condition_post = Post.objects.get(pk=condition_post_id)
            categories_to_add.update(
                condition_post.projects.filter(type=category_type)
            )

        # Get categories from condition_child's post
        child_post_id = conditional.condition_child.post_id
        if child_post_id:
            child_post = Post.objects.get(pk=child_post_id)
            categories_to_add.update(
                child_post.projects.filter(type=category_type)
            )

        if categories_to_add:
            existing = set(post.projects.filter(type=category_type))
            new_categories = categories_to_add - existing
            if new_categories:
                post.projects.add(*new_categories)


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
