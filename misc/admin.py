from django.contrib import admin

from misc.models import Bulletin


@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    search_fields = ["bulletin_start", "bulletin_end", "text"]
