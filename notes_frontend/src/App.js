import React from 'react';
import NotesApp from './NotesApp';
import './App.css';
import './NotesApp.css';

// PUBLIC_INTERFACE
function App() {
  // Render the main notes app UI.
  return (
    <div className="App">
      <NotesApp />
    </div>
  );
}

export default App;
