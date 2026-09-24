from rest_framework import serializers
from .models import Note, COLOR_PALETTE, COLOR_ALIASES, normalize_color, DEFAULT_COLOR


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'text', 'color', 'x', 'y', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_color(self, value):
        normalized = normalize_color(value)
        if normalized not in COLOR_PALETTE:
            valid_options = list(COLOR_PALETTE.keys()) + list(COLOR_ALIASES.keys())
            raise serializers.ValidationError(
                f"Invalid color '{value}'. Allowed options are: {', '.join(valid_options)}"
            )
        return normalized

    def validate_x(self, value):
        if value < 0:
            raise serializers.ValidationError("X coordinate must be non-negative.")
        return value

    def validate_y(self, value):
        if value < 0:
            raise serializers.ValidationError("Y coordinate must be non-negative.")
        return value
