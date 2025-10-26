import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type DayNote = Database['public']['Tables']['day_notes']['Row'];
type DayNoteInsert = Database['public']['Tables']['day_notes']['Insert'];
type DayNoteUpdate = Database['public']['Tables']['day_notes']['Update'];

export async function getDayNote(date: string): Promise<DayNote | null> {
  const { data, error } = await supabase
    .from('day_notes')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDayNotes(startDate?: string, endDate?: string) {
  let query = supabase
    .from('day_notes')
    .select('*');

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data as DayNote[];
}

export async function upsertDayNote(date: string, note: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  if (!note || note.trim() === '') {
    const { error } = await supabase
      .from('day_notes')
      .delete()
      .eq('date', date);

    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from('day_notes')
    .upsert({
      owner_id: user.id,
      date,
      note,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DayNote;
}
