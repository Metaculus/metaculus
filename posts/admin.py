from django.contrib import admin

from posts.models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    autocomplete_fields = ["author", "approved_by", "question", "projects", "conditional", "group_of_questions"]
