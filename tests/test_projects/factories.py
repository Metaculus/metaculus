from factory.django import DjangoModelFactory

from projects.models import Project


class TagFactory(DjangoModelFactory):
    class Meta:
        model = Project

    type = Project.ProjectTypes.TAG
