import { supabase } from '../lib/supabase';
import type { Database, CategoryKind } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export async function getCategories(kind?: CategoryKind) {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true);

  if (kind) {
    query = query.eq('kind', kind);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data as Category[];
}

export async function createCategory(category: Omit<CategoryInsert, 'owner_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, updates: CategoryUpdate) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string, migrateToId?: string) {
  if (migrateToId) {
    const { error: updateError } = await supabase
      .from('movements')
      .update({ category_id: migrateToId })
      .eq('category_id', id);

    if (updateError) throw updateError;
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function checkCategoryHasMovements(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('movements')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}
