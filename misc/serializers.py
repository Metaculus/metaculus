from django.utils.text import slugify
from rest_framework import serializers

from misc.models import SidebarItem
from projects.models import Project


class ContactSerializer(serializers.Serializer):
    email = serializers.EmailField()
    message = serializers.CharField()
    subject = serializers.CharField(required=False, allow_blank=True)



class SidebarItemSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    post = serializers.SerializerMethodField()

    class Meta:
        model = SidebarItem
        fields = ("name", "emoji", "section", "url", "post", "project", "order")

    @classmethod
    def serialize_project(cls, project: Project):
        return {
            "id": project.id,
            "type": project.type,
            "name": project.name,
            "slug": project.slug,
            "emoji": project.emoji,
        }

    def get_project(self, obj: SidebarItem):
        if obj.project:
            return self.serialize_project(obj.project)

    def get_post(self, obj: SidebarItem):
        if obj.post:
            return {
                "id": obj.post.id,
                "slug": slugify(obj.post.get_short_title()),
                "title": obj.post.title,
                "notebook": (
                    {
                        "id": obj.post.notebook_id,
                    }
                    if obj.post.notebook_id
                    else None
                ),
                "group_of_questions": (
                    {"id": obj.post.group_of_questions_id}
                    if obj.post.group_of_questions_id
                    else None
                ),
                "question": (
                    {"id": obj.post.question_id} if obj.post.question_id else None
                ),
                "conditional": (
                    {"id": obj.post.conditional_id} if obj.post.conditional_id else None
                ),
                "projects": {
                    "default_project": self.serialize_project(obj.post.default_project)
                },
            }
