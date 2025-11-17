from django.contrib import admin
from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """Admin interface for Note model"""
    list_display = ['id', 'text', 'color', 'x', 'y', 'created_at', 'updated_at']
    list_filter = ['color', 'created_at']
    search_fields = ['text']
    readonly_fields = ['created_at', 'updated_at']

