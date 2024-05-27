from django.utils.text import slugify

from projects.models import Project


def get_or_create_tag(name: str) -> Project:
    qs = Project.objects.filter(type=Project.ProjectTypes.TAG)

    # Check if a tag with the given name already exists
    try:
        return qs.get(name__iexact=name)
    except Project.DoesNotExist:
        pass

    # Generate a unique slug
    base_slug = slugify(name)
    slug = base_slug
    counter = 1

    while qs.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # TODO: probably we should set is_active to False
    #   for manual approval of the new tags
    return Project.objects.create(type=Project.ProjectTypes.TAG, name=name, slug=slug)
