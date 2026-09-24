from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Note, COLOR_PALETTE, DEFAULT_COLOR


class NoteModelTest(TestCase):
    def test_create_note_defaults(self):
        """Verify note is created with expected defaults."""
        note = Note.objects.create()
        self.assertEqual(note.text, '')
        self.assertEqual(note.color, DEFAULT_COLOR)
        self.assertEqual(note.x, 100)
        self.assertEqual(note.y, 100)
        self.assertIsNotNone(note.created_at)
        self.assertIsNotNone(note.updated_at)

    def test_legacy_color_alias_normalization(self):
        """Verify legacy color names like 'yellow', 'blue' are normalized to hex."""
        note = Note.objects.create(color='yellow')
        self.assertEqual(note.color, '#ffdd67')

        note2 = Note.objects.create(color='BLUE')
        self.assertEqual(note2.color, '#dde3ec')

    def test_invalid_color_raises_validation_error(self):
        """Verify invalid color values cannot be saved."""
        with self.assertRaises(ValidationError):
            note = Note(text='Test', color='invalid-color-value; body { display:none }')
            note.save()

    def test_negative_coordinates_raise_validation_error(self):
        """Verify negative coordinates fail validation."""
        with self.assertRaises(ValidationError):
            note = Note(text='Test', x=-10, y=50)
            note.save()

    def test_string_representation(self):
        """Verify string representation of note."""
        note = Note.objects.create(text='Meeting notes for sprint planning')
        self.assertIn('Meeting notes', str(note))
        self.assertIn(f'Note {note.id}', str(note))


class NoteAPITest(APITestCase):
    def test_list_notes_empty(self):
        """GET /api/notes/ returns empty list when no notes exist."""
        response = self.client.get('/api/notes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_create_note_success(self):
        """POST /api/notes/ creates a new note."""
        payload = {
            'text': 'Buy groceries',
            'color': '#bae6fd',
            'x': 150,
            'y': 250,
        }
        response = self.client.post('/api/notes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['text'], 'Buy groceries')
        self.assertEqual(data['color'], '#bae6fd')
        self.assertEqual(data['x'], 150)
        self.assertEqual(data['y'], 250)
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        # Verify persistence in database
        self.assertTrue(Note.objects.filter(id=data['id']).exists())

    def test_create_note_with_legacy_color_alias(self):
        """POST /api/notes/ normalizes legacy color string to hex."""
        payload = {
            'text': 'Buy groceries',
            'color': 'yellow',
            'x': 50,
            'y': 60,
        }
        response = self.client.post('/api/notes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['color'], '#ffdd67')

    def test_create_note_invalid_color_rejected(self):
        """POST /api/notes/ with arbitrary color returns 400."""
        payload = {
            'text': 'CSS injection attempt',
            'color': 'red; background: black;',
            'x': 100,
            'y': 100,
        }
        response = self.client.post('/api/notes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('color', response.json())

    def test_create_note_negative_coordinate_rejected(self):
        """POST /api/notes/ with negative coordinates returns 400."""
        payload = {
            'text': 'Offscreen note',
            'color': '#fef08a',
            'x': -50,
            'y': 100,
        }
        response = self.client.post('/api/notes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('x', response.json())

    def test_retrieve_note(self):
        """GET /api/notes/<id>/ retrieves note."""
        note = Note.objects.create(text='Retrieve me', color='#fbcfe8', x=200, y=300)
        response = self.client.get(f'/api/notes/{note.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['text'], 'Retrieve me')
        self.assertEqual(response.json()['id'], note.id)

    def test_retrieve_nonexistent_note_returns_404(self):
        """GET /api/notes/99999/ returns 404."""
        response = self.client.get('/api/notes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_note_put(self):
        """PUT /api/notes/<id>/ updates note completely."""
        note = Note.objects.create(text='Original text', color='#fef08a', x=100, y=100)
        payload = {
            'text': 'Updated text',
            'color': '#bbf7d0',
            'x': 320,
            'y': 410,
        }
        response = self.client.put(f'/api/notes/{note.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        note.refresh_from_db()
        self.assertEqual(note.text, 'Updated text')
        self.assertEqual(note.color, '#bbf7d0')
        self.assertEqual(note.x, 320)
        self.assertEqual(note.y, 410)

    def test_partial_update_note_patch(self):
        """PATCH /api/notes/<id>/ updates specific fields."""
        note = Note.objects.create(text='Original text', color='#fef08a', x=100, y=100)
        payload = {'x': 450, 'y': 550}
        response = self.client.patch(f'/api/notes/{note.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        note.refresh_from_db()
        self.assertEqual(note.text, 'Original text')
        self.assertEqual(note.x, 450)
        self.assertEqual(note.y, 550)

    def test_delete_note(self):
        """DELETE /api/notes/<id>/ removes note from database."""
        note = Note.objects.create(text='To be deleted')
        response = self.client.delete(f'/api/notes/{note.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(id=note.id).exists())

    def test_delete_nonexistent_note_returns_404(self):
        """DELETE /api/notes/99999/ returns 404."""
        response = self.client.delete('/api/notes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
