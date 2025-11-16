import React from 'react';

export default function Note({ note, onDragEnd, onDelete, onChange }) {
  return (
    <div
      style={{
        position: "absolute",
        left: note.x,
        top: note.y,
        background: note.color,
        padding: "10px",
        width: "150px",
        borderRadius: "8px",
        cursor: "grab"
      }}
      draggable
      onDragEnd={(e) =>
        onDragEnd(note.id, e.clientX, e.clientY)
      }
    >
      <textarea
        value={note.text}
        onChange={(e) => onChange(note.id, e.target.value)}
        style={{ width: "100%", height: "100px", border: "none", background: "transparent" }}
      />
      <button onClick={() => onDelete(note.id)}>Delete</button>
    </div>
  );
}