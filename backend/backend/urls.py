"""
URL configuration for Sticky_Notes project.
"""

from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse, JsonResponse
from django.db import connection

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_BUILD_DIR = BASE_DIR.parent / 'frontend' / 'build'


def health_check(request):
    """Health check endpoint for Railway and monitoring services."""
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception as e:
        db_ok = False
        return JsonResponse({'status': 'unhealthy', 'database': str(e)}, status=503)

    return JsonResponse({'status': 'ok', 'database': 'connected'})


def serve_spa(request):
    """Serve the React single-page application index.html if built, otherwise API welcome."""
    index_file = FRONTEND_BUILD_DIR / 'index.html'
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return JsonResponse({
        'name': 'Sticky Notes API',
        'status': 'online',
        'endpoints': {
            'notes': '/api/notes/',
            'health': '/health/',
            'admin': '/admin/',
        },
        'message': 'Backend is operational. For frontend, run build or connect the frontend client.',
    })


urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/', include('notes.urls')),
    re_path(r'^(?!api/|admin/|health/|static/).*$', serve_spa, name='spa'),
]
