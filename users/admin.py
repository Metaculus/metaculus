from django.contrib import admin

from users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["username", "id", "email", "is_active", "is_bot", "date_joined"]
    search_fields = ["username", "email", "pk"]
