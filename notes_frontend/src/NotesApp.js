import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote
} from './api';
import './NotesApp.css';

// --- Helper Components ---

// PUBLIC_INTERFACE
function HeaderBar({ children }) {
  return (
    <header className="header">
      <h1 className="header-title">Notemaster</h1>
      {children}
    </header>
  );
}

// PUBLIC_INTERFACE
function NoteList({ notes, selectedId, onSelect, search, onSearch }) {
  return (
    <aside className="note-list">
      <div className="note-list-search">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          aria-label="Search notes"
        />
      </div>
      <ul>
        {notes.length === 0 && <li className="placeholder">No notes found.</li>}
        {notes.map(note => (
          <li
            key={note.id}
            className={`note-list-item${selectedId === note.id ? ' selected' : ''}`}
            onClick={() => onSelect(note.id)}
            tabIndex={0}
          >
            <div className="note-list-title">{note.title || <em>(Untitled)</em>}</div>
            <span className="note-updated">{note.updated_at ? formatDate(note.updated_at) : ''}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// PUBLIC_INTERFACE
function NoteDetail({
  note,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange
}) {
  if (!note) {
    return (
      <section className="note-detail empty">
        <div>Select or create a note to get started.</div>
      </section>
    );
  }
  return (
    <section className="note-detail">
      {!isEditing ? (
        <div>
          <h2>{note.title || '(Untitled)'}</h2>
          <div className="note-content">{note.content || <em>No content.</em>}</div>
          <div className="note-detail-actions">
            <button className="btn secondary" onClick={onEdit}>Edit</button>
            <button className="btn accent" onClick={onDelete}>Delete</button>
          </div>
        </div>
      ) : (
        <form
          className="note-form"
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
        >
          <input
            type="text"
            className="note-input-title"
            placeholder="Note title"
            value={note.title}
            onChange={e => onFieldChange('title', e.target.value)}
            autoFocus
            maxLength={100}
            aria-label="Note title"
          />
          <textarea
            className="note-input-content"
            placeholder="Write your note here..."
            rows={10}
            value={note.content}
            onChange={e => onFieldChange('content', e.target.value)}
            aria-label="Note content"
          />
          <div className="note-form-actions">
            <button className="btn" type="submit">Save</button>
            <button className="btn secondary" type="button" onClick={onCancel}>Cancel</button>
            {note.id && (
              <button className="btn accent" type="button" onClick={onDelete}>Delete</button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

// PUBLIC_INTERFACE
function FloatingAddButton({ onClick }) {
  return (
    <button className="floating-add-btn" aria-label="Add new note" onClick={onClick}>
      +
    </button>
  );
}

// Format date string as "MMM DD, YYYY HH:mm"
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return '';
  }
}

// --- Main Notes App Component ---

// PUBLIC_INTERFACE
function NotesApp() {
  // UI state
  const [noteList, setNoteList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  // Editor state
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // Loading/error
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  // Fetch notes from Supabase
  const loadNotes = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setErrMsg(null);
    try {
      const notes = await fetchNotes(searchTerm);
      setNoteList(notes);
    } catch (e) {
      setErrMsg("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notes on mount or when searching
  useEffect(() => {
    loadNotes(search);
  }, [search, loadNotes]);

  // When selecting a note, update UI
  const selectNote = id => {
    const note = noteList.find(n => n.id === id);
    setSelectedId(id);
    setCurrentNote(note ? { ...note } : null);
    setIsEditing(false);
  };

  // Add a new note
  const handleAdd = async () => {
    setIsEditing(true);
    setCurrentNote({
      id: null,
      title: '',
      content: '',
    });
    setSelectedId(null);
  };

  // Edit button
  const handleEdit = () => setIsEditing(true);

  // Field change in form
  const handleFieldChange = (field, value) => {
    setCurrentNote(note => ({
      ...note,
      [field]: value
    }));
  };

  // Save new or edited note
  const handleSave = async () => {
    setErrMsg(null);
    try {
      if (currentNote.id) {
        // update
        const updated = await updateNote(currentNote.id, {
          title: currentNote.title,
          content: currentNote.content
        });
        setNoteList(notes => notes.map(n => n.id === updated.id ? updated : n));
        setCurrentNote({ ...updated });
      } else {
        // create
        const created = await createNote({
          title: currentNote.title,
          content: currentNote.content
        });
        setNoteList(notes => [created, ...notes]);
        setCurrentNote({ ...created });
        setSelectedId(created.id);
      }
      setIsEditing(false);
    } catch (e) {
      setErrMsg("Failed to save note.");
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    setErrMsg(null);
    try {
      if (currentNote && currentNote.id) {
        await deleteNote(currentNote.id);
        setNoteList(notes => notes.filter(n => n.id !== currentNote.id));
        setCurrentNote(null);
        setSelectedId(null);
      } else {
        setCurrentNote(null);
      }
      setIsEditing(false);
    } catch (e) {
      setErrMsg("Failed to delete note.");
    }
  };

  // Main layout: Sidebar list, editor/view
  return (
    <div className="notes-app-main">
      <HeaderBar />
      <div className="notes-layout">
        <NoteList
          notes={noteList}
          selectedId={selectedId}
          onSelect={selectNote}
          search={search}
          onSearch={setSearch}
        />
        <main className="notes-main">
          {errMsg && <div className="error-msg">{errMsg}</div>}
          <NoteDetail
            note={currentNote}
            isEditing={isEditing}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            onDelete={handleDelete}
            onFieldChange={handleFieldChange}
          />
        </main>
        <FloatingAddButton onClick={handleAdd} />
      </div>
      {loading && <div className="global-loading">Loading...</div>}
    </div>
  );
}

export default NotesApp;
