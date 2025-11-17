from django.db import models


class Note(models.Model):
    """Model for sticky notes"""
    text = models.TextField(default="New Note")
    color = models.CharField(max_length=50, default="yellow")
    x = models.IntegerField(default=100)
    y = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note {self.id}: {self.text[:30]}"
