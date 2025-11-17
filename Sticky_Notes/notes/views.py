from rest_framework import viewsets
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    """ViewSet for Note CRUD operations"""
    queryset = Note.objects.all()
    serializer_class = NoteSerializer

