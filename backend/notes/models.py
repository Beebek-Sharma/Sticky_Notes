from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


# Predefined, safe palette of note colors (Google Stitch & Pastel Palette)
COLOR_PALETTE = {
    # Google Stitch Tactile Canvas Palette
    '#ffdd67': 'Canary Yellow',
    '#88d6af': 'Fresh Mint',
    '#dde3ec': 'Sky Azure',
    '#e4c451': 'Peach Clay',
    '#dce3ec': 'Soft Lavender',
    # Legacy Pastel Palette for backward compatibility
    '#fef08a': 'Yellow',
    '#bbf7d0': 'Green',
    '#bae6fd': 'Blue',
    '#fbcfe8': 'Pink',
    '#fed7aa': 'Orange',
    '#e9d5ff': 'Purple',
}

# Color aliases for backward compatibility and quick styling
COLOR_ALIASES = {
    'yellow': '#ffdd67',
    'mint': '#88d6af',
    'green': '#88d6af',
    'sky': '#dde3ec',
    'blue': '#dde3ec',
    'peach': '#e4c451',
    'orange': '#e4c451',
    'lavender': '#dce3ec',
    'purple': '#dce3ec',
    'pink': '#fbcfe8',
}

DEFAULT_COLOR = '#ffdd67'


def normalize_color(color_value: str) -> str:
    """Normalize legacy color names to hex codes."""
    if not color_value:
        return DEFAULT_COLOR
    val = color_value.strip().lower()
    if val in COLOR_ALIASES:
        return COLOR_ALIASES[val]
    return val


def validate_note_color(color_value: str) -> None:
    """Validate that the note color belongs to the allowed palette."""
    normalized = normalize_color(color_value)
    if normalized not in COLOR_PALETTE:
        valid_options = list(COLOR_PALETTE.keys()) + list(COLOR_ALIASES.keys())
        raise ValidationError(
            f"Invalid color '{color_value}'. Allowed colors are: {', '.join(valid_options)}"
        )


class Note(models.Model):
    """
    Model representing a Sticky Note on a 2D canvas board.
    """
    title = models.CharField(max_length=200, blank=True, default='')
    text = models.TextField(blank=True, default='')
    color = models.CharField(
        max_length=20,
        default=DEFAULT_COLOR,
        validators=[validate_note_color],
        help_text="Hex code of the note color from the allowed palette."
    )
    x = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0)],
        help_text="X coordinate in pixels on the note board."
    )
    y = models.IntegerField(
        default=100,
        validators=[MinValueValidator(0)],
        help_text="Y coordinate in pixels on the note board."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'

    def clean(self):
        super().clean()
        self.color = normalize_color(self.color)
        validate_note_color(self.color)

    def save(self, *args, **kwargs):
        self.color = normalize_color(self.color)
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        heading = self.title or self.text
        snippet = (heading[:30] + '...') if len(heading) > 30 else (heading or '(empty note)')
        return f"Note {self.id}: {snippet}"
