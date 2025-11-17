from rest_framework import serializers
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for Note model"""
    class Meta:
        model = Note
        fields = ['id', 'text', 'color', 'x', 'y', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
