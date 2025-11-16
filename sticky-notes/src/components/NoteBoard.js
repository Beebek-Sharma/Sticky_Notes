import axios from "axios";
import React, { useEffect, useState } from 'react';
import Note from './Note';

export default function NoteBoard() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/api/notes/").then(res => {
      setNotes(res.data);
    });
  }, []);

  const createNote = () => {
    axios.post("http://localhost:8000/api/notes/", {
      text: "New Note",
      color: "yellow",
      x: 100,
      y: 100
    }).then(res => setNotes([...notes, res.data]));
  };

  const updateNotePosition = (id, x, y) => {
    const note = notes.find(n => n.id === id);

    axios.put(`http://localhost:8000/api/notes/${id}/`, {
      ...note,
      x, y
    }).then(res => {
      setNotes(notes.map(n => (n.id === id ? res.data : n)));
    });
  };

  const updateNoteText = (id, text) => {
    const note = notes.find(n => n.id === id);

    axios.put(`http://localhost:8000/api/notes/${id}/`, {
      ...note,
      text
    }).then(res => {
      setNotes(notes.map(n => (n.id === id ? res.data : n)));
    });
  };

  const deleteNote = (id) => {
    axios.delete(`http://localhost:8000/api/notes/${id}/`);
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <button onClick={createNote}>Add Note</button>

      {notes.map(note => (
        <Note
          key={note.id}
          note={note}
          onDragEnd={updateNotePosition}
          onDelete={deleteNote}
          onChange={updateNoteText}
        />
      ))}
    </div>
  );
}