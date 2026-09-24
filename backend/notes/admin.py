from django.contrib import admin
from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'text_preview', 'color', 'x', 'y', 'created_at', 'updated_at')
    list_filter = ('color', 'created_at')
    search_fields = ('text',)
    readonly_fields = ('created_at', 'updated_at')

    def text_preview(self, obj):
        if not obj.text:
            return '(empty)'
        return obj.text[:40] + ('...' if len(obj.text) > 40 else '')
    text_preview.short_description = 'Text'
