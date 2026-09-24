from rest_framework import viewsets
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing sticky notes.
    Supports list, create, retrieve, update, partial update, and delete.
    """
    queryset = Note.objects.all().order_by('id')
    serializer_class = NoteSerializer
