import React, { useEffect, useState, useRef, useCallback } from 'react';
import Note, { STITCH_PALETTE } from './Note';
import { getNotes, createNote, patchNote, deleteNote } from '../api';

export default function NoteBoard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [lastApiStatus, setLastApiStatus] = useState('200 OK');
  const [lastApiMethod, setLastApiMethod] = useState('GET');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const boardRef = useRef(null);

  // Fetch all notes from Django REST API
  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastApiMethod('GET');
    try {
      const data = await getNotes();
      setNotes(Array.isArray(data) ? data : []);
      setLastApiStatus('200 OK');
    } catch (err) {
      console.error('Failed to load notes:', err);
      setError('Unable to reach Django backend. Please verify the backend server is running.');
      setLastApiStatus('500 Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Keyboard shortcut: ⌘K or Ctrl+K to focus search, ESC to clear
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Create new note with selected or default color
  const handleCreateNote = async (chosenColor) => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);

    const offsetIndex = notes.length % 8;
    const initialX = 70 + offsetIndex * 40;
    const initialY = 120 + offsetIndex * 35;
    const color = chosenColor || STITCH_PALETTE[offsetIndex % STITCH_PALETTE.length].hex;

    const payload = {
      title: 'New Note',
      text: '',
      color: color,
      x: initialX,
      y: initialY,
    };

    setLastApiMethod('POST');
    try {
      const created = await createNote(payload);
      setNotes((prev) => [...prev, created]);
      setLastApiStatus('201 Created');
    } catch (err) {
      console.error('Failed to create note:', err);
      setError('Failed to create note. Please check your connection.');
      setLastApiStatus('400 Error');
    } finally {
      setIsCreating(false);
    }
  };

  // Duplicate an existing note
  const handleDuplicateNote = async (originalNote) => {
    const payload = {
      title: `${originalNote.title || 'Note'} (Copy)`,
      text: originalNote.text || '',
      color: originalNote.color || STITCH_PALETTE[0].hex,
      x: (originalNote.x || 100) + 40,
      y: (originalNote.y || 100) + 40,
    };

    setLastApiMethod('POST');
    try {
      const created = await createNote(payload);
      setNotes((prev) => [...prev, created]);
      setLastApiStatus('201 Created');
    } catch (err) {
      console.error('Failed to duplicate note:', err);
      setError('Failed to duplicate note.');
    }
  };

  // Update content (title / text)
  const handleContentChange = useCallback(async (id, content) => {
    setLastApiMethod('PATCH');
    try {
      const updated = await patchNote(id, content);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, title: updated.title, text: updated.text } : n))
      );
      setLastApiStatus('200 OK');
    } catch (err) {
      console.error('Failed to save note content:', err);
      setError('Failed to save changes to the backend.');
      setLastApiStatus('400 Error');
    }
  }, []);

  // Update coordinates
  const handlePositionChange = useCallback(async (id, x, y) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    setLastApiMethod('PATCH');
    try {
      await patchNote(id, { x, y });
      setLastApiStatus('200 OK');
    } catch (err) {
      console.error('Failed to persist position:', err);
      setError('Failed to save note position.');
      loadNotes();
    }
  }, [loadNotes]);

  // Update color
  const handleColorChange = useCallback(async (id, color) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));
    setLastApiMethod('PATCH');
    try {
      await patchNote(id, { color });
      setLastApiStatus('200 OK');
    } catch (err) {
      console.error('Failed to update note color:', err);
      setError('Failed to update note color.');
      loadNotes();
    }
  }, [loadNotes]);

  // Delete note
  const handleDeleteNote = useCallback(async (id) => {
    setError(null);
    setLastApiMethod('DELETE');
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setLastApiStatus('204 Deleted');
    } catch (err) {
      console.error('Failed to delete note:', err);
      setError('Failed to delete note from the server.');
      setLastApiStatus('400 Error');
      throw err;
    }
  }, []);

  // Clear all notes action
  const handleClearAllNotes = async () => {
    if (notes.length === 0) return;
    if (!window.confirm('Are you sure you want to delete all notes on this board?')) return;
    try {
      for (const note of notes) {
        await deleteNote(note.id);
      }
      setNotes([]);
      setLastApiStatus('204 Cleared');
    } catch (err) {
      console.error('Failed to clear notes:', err);
      loadNotes();
    }
  };

  // Manual sync button
  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await loadNotes();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoom(100);

  // Filter notes by search query
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = (n.title || '').toLowerCase().includes(query);
    const textMatch = (n.text || '').toLowerCase().includes(query);
    const idMatch = `note-${n.id}`.toLowerCase().includes(query);
    return titleMatch || textMatch || idMatch;
  });

  return (
    <div className="stitch-app-wrapper" ref={boardRef}>
      {/* Top Navigation Bar */}
      <header className="stitch-navbar">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <span className="material-symbols-outlined text-[18px]">note_stack</span>
          </div>
          <h1 className="brand-title">StickyNotes</h1>

          <div className="db-status-pill">
            <div className="pulse-dot" />
            <span>Live DB Connected</span>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="navbar-center-search">
          <div className="search-input-wrap">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              id="navbar-search"
              className="search-input"
              type="text"
              placeholder="Search notes, tags, content (⌘K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                className="search-shortcut-badge cursor-pointer"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                ✕
              </button>
            ) : (
              <span className="search-shortcut-badge">ESC</span>
            )}
          </div>
        </div>

        {/* Right Navigation & Controls */}
        <div className="navbar-right-actions">
          {/* Freeform / Grid Toggle */}
          <div className="view-toggle-pill" role="group" aria-label="Canvas layout mode">
            <button
              type="button"
              className={`view-toggle-btn ${!isGridView ? 'active' : ''}`}
              onClick={() => setIsGridView(false)}
              title="Freeform Canvas"
              aria-label="Freeform Canvas"
            >
              <span className="material-symbols-outlined text-[18px]">gesture</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${isGridView ? 'active' : ''}`}
              onClick={() => setIsGridView(true)}
              title="Grid View"
              aria-label="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            className="btn-add-note"
            onClick={() => handleCreateNote()}
            disabled={isCreating}
            id="navbar-add-note-btn"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{isCreating ? 'Adding…' : 'Add Note'}</span>
          </button>

          {/* Clear All Notes */}
          <button
            type="button"
            className="icon-btn"
            onClick={handleClearAllNotes}
            title="Clear All Notes"
            aria-label="Clear All Notes"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          </button>
        </div>
      </header>

      {/* Floating Canvas HUD (Heads-Up Display) */}
      {!isGridView && (
        <div className="floating-hud">
          {/* New Note with Hover Color Sprout */}
          <div className="hud-color-group">
            <button
              type="button"
              className="hud-new-note-btn"
              onClick={() => handleCreateNote()}
              id="hud-new-note-btn"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>New Note</span>
            </button>

            {/* Color Sprout Dropdown */}
            <div className="hud-sprout-menu">
              {STITCH_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className="hud-sprout-swatch"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => handleCreateNote(c.hex)}
                  title={`Add ${c.name} Note`}
                />
              ))}
            </div>
          </div>

          <div className="hud-divider" />

          {/* Zoom Controls */}
          <div className="hud-zoom-controls">
            <button
              type="button"
              className="hud-zoom-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="hud-zoom-level">{zoom}%</span>
            <button
              type="button"
              className="hud-zoom-btn"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
            <button
              type="button"
              className="hud-zoom-btn ml-1"
              onClick={handleZoomReset}
              title="Recenter Canvas"
            >
              <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
            </button>
          </div>

          <div className="hud-divider" />

          {/* SQLite Sync Pill */}
          <div className="hud-sync-pill">
            <span className="pulse-dot" style={{ backgroundColor: 'var(--tertiary-fixed-dim)' }} />
            <span>SQLite Connected</span>
          </div>
        </div>
      )}

      {/* Workspace Telemetry Ribbon (Top-Right) */}
      <div className="telemetry-ribbon hidden lg:flex">
        <span>{notes.length} Active Notes</span>
        <span>•</span>
        <span>Debounce: 500ms</span>
        <span>•</span>
        <span style={{ color: 'var(--tertiary-fixed-dim)', fontWeight: 600 }}>Auto-flush: ON</span>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: 'var(--error-container)',
            color: 'var(--error)',
            padding: '8px 18px',
            borderRadius: '9999px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadNotes}
            style={{
              background: 'var(--error)',
              color: '#ffffff',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Board Viewport */}
      <main className="canvas-viewport bg-grid-dots" id="board-canvas">
        {loading ? (
          <div className="stitch-empty-state" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p>Loading your Tactile Canvas…</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="stitch-empty-state">
            <div className="stitch-empty-icon" aria-hidden="true">
              <span className="material-symbols-outlined text-[48px]">note_add</span>
            </div>
            <h2 className="stitch-empty-title">
              {searchQuery ? 'No matching notes found' : 'No notes on the board'}
            </h2>
            <p className="stitch-empty-desc">
              {searchQuery
                ? `No notes match "${searchQuery}". Press ESC to clear search filter.`
                : 'Click "+ Add Note" or "New Note" to place your first sticky note on the canvas.'}
            </p>
          </div>
        ) : isGridView ? (
          /* Grid View Mode */
          <div className="grid-canvas-container">
            {filteredNotes.map((note) => (
              <Note
                key={note.id}
                note={note}
                isGridView={true}
                onPositionChange={handlePositionChange}
                onContentChange={handleContentChange}
                onColorChange={handleColorChange}
                onDelete={handleDeleteNote}
                onDuplicate={handleDuplicateNote}
              />
            ))}
          </div>
        ) : (
          /* Freeform Interactive Canvas Mode */
          <div
            className="canvas-plane"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Ambient Background Glows */}
            <div className="ambient-glow-1" />
            <div className="ambient-glow-2" />

            {filteredNotes.map((note) => (
              <Note
                key={note.id}
                note={note}
                isGridView={false}
                onPositionChange={handlePositionChange}
                onContentChange={handleContentChange}
                onColorChange={handleColorChange}
                onDelete={handleDeleteNote}
                onDuplicate={handleDuplicateNote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Live REST Sync Inspector Bar */}
      <div className="rest-inspector-dock">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="rest-method-badge">{lastApiMethod}</span>
          <span className="rest-endpoint-url">/api/notes/</span>
          <span className="rest-status-badge">{lastApiStatus}</span>
          <span style={{ color: 'var(--outline-variant)' }}>({notes.length} notes)</span>
        </div>

        <button
          type="button"
          className="btn-manual-sync"
          onClick={handleManualSync}
          disabled={isManualSyncing}
        >
          <span
            className={`material-symbols-outlined text-[14px] ${
              isManualSyncing ? 'animate-spin' : ''
            }`}
          >
            refresh
          </span>
          <span>{isManualSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Bottom Footer Bar */}
      <footer className="stitch-footer">
        <div>
          <span>Canvas Zoom: <strong>{zoom}%</strong></span>
          <span style={{ margin: '0 8px' }}>•</span>
          <span>Auto-save: <strong>Synced with Django REST</strong></span>
        </div>

        <div>
          <span>Reposition: <kbd style={{ background: 'var(--surface-container)', padding: '1px 4px', borderRadius: '3px' }}>Arrows</kbd> / Drag</span>
        </div>
      </footer>
    </div>
  );
}