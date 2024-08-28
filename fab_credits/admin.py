from django.contrib import admin

from . import models


@admin.register(models.UserUsage)
class UserUsageAdmin(admin.ModelAdmin):
    autocomplete_fields = ("user",)
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["input_tokens_used", "output_tokens_used"]
