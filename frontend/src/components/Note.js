import React, { useState, useEffect, useRef } from 'react';

export const STITCH_PALETTE = [
  { hex: '#ffdd67', name: 'Canary Yellow', ink: '#151c23', border: '#ead872', tagColor: '#715c00' },
  { hex: '#88d6af', name: 'Fresh Mint', ink: '#08331e', border: '#aee0c4', tagColor: '#005236' },
  { hex: '#dde3ec', name: 'Sky Azure', ink: '#0b2f48', border: '#afd1e8', tagColor: '#161c23' },
  { hex: '#e4c451', name: 'Peach Clay', ink: '#231b00', border: '#e8b8c2', tagColor: '#554500' },
  { hex: '#dce3ec', name: 'Soft Lavender', ink: '#29154c', border: '#d2c0ee', tagColor: '#41474f' },
];

export default function Note({
  note,
  onPositionChange,
  onContentChange,
  onColorChange,
  onDelete,
  onDuplicate,
  isGridView,
}) {
  const [localTitle, setLocalTitle] = useState(note.title || '');
  const [localText, setLocalText] = useState(note.text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: note.x || 100, y: note.y || 100 });

  const debounceTimerRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialNoteX: 0, initialNoteY: 0 });
  const noteRef = useRef(null);

  // Match current color to palette config
  const colorTheme =
    STITCH_PALETTE.find((c) => c.hex.toLowerCase() === (note.color || '').toLowerCase()) ||
    STITCH_PALETTE[0];

  useEffect(() => {
    setPosition({ x: note.x || 100, y: note.y || 100 });
  }, [note.x, note.y]);

  useEffect(() => {
    if (!debounceTimerRef.current) {
      setLocalTitle(note.title || '');
      setLocalText(note.text || '');
    }
  }, [note.title, note.text]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced auto-save for title & body text
  const scheduleSave = (newTitle, newText) => {
    setIsSaving(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      debounceTimerRef.current = null;
      try {
        await onContentChange(note.id, { title: newTitle, text: newText });
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setLocalTitle(val);
    scheduleSave(val, localText);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setLocalText(val);
    scheduleSave(localTitle, val);
  };

  // Immediate save on blur
  const handleBlur = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      setIsSaving(true);
      try {
        await onContentChange(note.id, { title: localTitle, text: localText });
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Pointer drag events for freeform canvas
  const handlePointerDown = (e) => {
    if (isGridView) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialNoteX: position.x,
      initialNoteY: position.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(0, Math.round(dragStartRef.current.initialNoteX + deltaX));
    const newY = Math.max(0, Math.round(dragStartRef.current.initialNoteY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = async (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    if (position.x !== note.x || position.y !== note.y) {
      await onPositionChange(note.id, position.x, position.y);
    }
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = async (e) => {
    if (isGridView) return;
    const STEP = e.shiftKey ? 50 : 16;
    let nextX = position.x;
    let nextY = position.y;

    if (e.key === 'ArrowLeft') nextX = Math.max(0, position.x - STEP);
    else if (e.key === 'ArrowRight') nextX = position.x + STEP;
    else if (e.key === 'ArrowUp') nextY = Math.max(0, position.y - STEP);
    else if (e.key === 'ArrowDown') nextY = position.y + STEP;
    else return;

    e.preventDefault();
    setPosition({ x: nextX, y: nextY });
    await onPositionChange(note.id, nextX, nextY);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const tagNumber = String(note.id).padStart(2, '0');
  const tagLabel = `NOTE-${tagNumber}`;

  return (
    <article
      ref={noteRef}
      role="region"
      aria-label={`Sticky Note ${tagLabel}`}
      className={`stitch-note-card ${isDragging ? 'dragging' : ''}`}
      style={{
        position: isGridView ? 'relative' : 'absolute',
        left: isGridView ? 'auto' : `${position.x}px`,
        top: isGridView ? 'auto' : `${position.y}px`,
        backgroundColor: colorTheme.hex,
        color: colorTheme.ink,
        borderColor: colorTheme.border,
        zIndex: isDragging ? 1000 : 10,
      }}
    >
      {/* Washi Tape Accent */}
      <div className="washi-tape" aria-hidden="true" />

      {/* Card Header with Drag Handle */}
      <div
        className="note-card-header"
        tabIndex={0}
        role="button"
        aria-label="Drag note or use arrow keys to reposition"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className="note-tag-badge" style={{ color: colorTheme.tagColor }}>
          <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          <span>{tagLabel}</span>
        </div>

        <div className="note-card-meta">
          <span className="note-time-label">
            {isSaving ? 'Saving…' : 'Saved'}
          </span>
          <button
            type="button"
            className="note-delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete note ${note.id}`}
            title="Delete Note"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      {/* Editable Title */}
      <input
        className="note-title-input"
        value={localTitle}
        onChange={handleTitleChange}
        onBlur={handleBlur}
        placeholder="Note Title..."
        aria-label={`Note title ${note.id}`}
      />

      {/* Editable Content */}
      <textarea
        className="note-body-textarea"
        value={localText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="Take a note..."
        aria-label={`Note content ${note.id}`}
        rows={4}
      />

      {/* Card Footer: Palette + Actions + Status */}
      <div className="note-card-footer">
        <div className="note-color-dots" role="toolbar" aria-label="Choose note color">
          {STITCH_PALETTE.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`note-color-swatch-dot ${
                colorTheme.hex.toLowerCase() === c.hex.toLowerCase() ? 'active' : ''
              }`}
              style={{ backgroundColor: c.hex }}
              onClick={() => onColorChange(note.id, c.hex)}
              aria-label={`Set color to ${c.name}`}
              title={c.name}
            />
          ))}
        </div>

        <div className="note-footer-actions">
          {onDuplicate && (
            <button
              type="button"
              className="note-duplicate-btn"
              onClick={() => onDuplicate(note)}
              title="Duplicate Note"
              aria-label={`Duplicate note ${note.id}`}
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          )}

          <div className="note-sync-indicator">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ color: isSaving ? 'var(--secondary)' : 'var(--tertiary-fixed-dim)' }}
            >
              {isSaving ? 'sync' : 'check_circle'}
            </span>
            <span>{isSaving ? 'Saving' : 'Synced'}</span>
          </div>
        </div>
      </div>
    </article>
  );
}