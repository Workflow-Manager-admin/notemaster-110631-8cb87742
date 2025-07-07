import { supabase } from './supabaseClient';

// PUBLIC_INTERFACE
export async function fetchNotes(search = '') {
  /** Fetch notes from Supabase. Supports search by title or content. */
  let query = supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });
  if (search) query = query.ilike('title', `%${search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a new note in Supabase. */
  const { data, error } = await supabase
    .from('notes')
    .insert([
      { title, content }
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }) {
  /** Update an existing note in Supabase. */
  const { data, error } = await supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note from Supabase. */
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
