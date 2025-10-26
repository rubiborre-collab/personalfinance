import { supabase } from '../lib/supabase';
import type { Database, MovementType, FixedFlag } from '../lib/database.types';

type Movement = Database['public']['Tables']['movements']['Row'];
type MovementInsert = Database['public']['Tables']['movements']['Insert'];
type MovementUpdate = Database['public']['Tables']['movements']['Update'];

export interface MovementWithDetails extends Movement {
  account?: { name: string; type: string } | null;
  account_from?: { name: string; type: string } | null;
  account_to?: { name: string; type: string } | null;
  category?: { name: string; kind: string } | null;
}

export interface MovementFilters {
  startDate?: string;
  endDate?: string;
  type?: MovementType;
  accountId?: string;
  categoryId?: string;
  fixedVar?: FixedFlag;
  includeTransfers?: boolean;
}

export async function getMovements(filters?: MovementFilters) {
  let query = supabase
    .from('movements')
    .select(`
      *,
      account:account_id(name, type),
      account_from:account_from_id(name, type),
      account_to:account_to_id(name, type),
      category:category_id(name, kind)
    `);

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.accountId) {
    query = query.or(`account_id.eq.${filters.accountId},account_from_id.eq.${filters.accountId},account_to_id.eq.${filters.accountId}`);
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.fixedVar) {
    query = query.eq('fixed_var', filters.fixedVar);
  }
  if (filters?.includeTransfers === false) {
    query = query.neq('type', 'transfer');
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error) throw error;
  return data as MovementWithDetails[];
}

export async function getMovementsByDate(date: string) {
  const { data, error } = await supabase
    .from('movements')
    .select(`
      *,
      account:account_id(name, type),
      account_from:account_from_id(name, type),
      account_to:account_to_id(name, type),
      category:category_id(name, kind)
    `)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MovementWithDetails[];
}

export async function createMovement(movement: Omit<MovementInsert, 'owner_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  console.log('Creating movement:', { ...movement, owner_id: user.id });

  const { data, error } = await supabase
    .from('movements')
    .insert({ ...movement, owner_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating movement:', error);
    throw error;
  }
  console.log('Movement created successfully:', data);
  return data as Movement;
}

export async function updateMovement(id: string, updates: MovementUpdate) {
  const { data, error } = await supabase
    .from('movements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Movement;
}

export async function deleteMovement(id: string) {
  const { error } = await supabase
    .from('movements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTotalsByMonth(year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('movements')
    .select('date, type, amount')
    .gte('date', startDate)
    .lte('date', endDate)
    .neq('type', 'transfer');

  if (error) throw error;

  const monthlyTotals: Record<number, { income: number; expense: number }> = {};

  for (let i = 0; i < 12; i++) {
    monthlyTotals[i] = { income: 0, expense: 0 };
  }

  data?.forEach((m) => {
    const month = parseInt(m.date.split('-')[1], 10) - 1;
    if (m.type === 'income') {
      monthlyTotals[month].income += m.amount;
    } else if (m.type === 'expense') {
      monthlyTotals[month].expense += m.amount;
    }
  });

  return monthlyTotals;
}

export async function getCategoryBreakdown(startDate: string, endDate: string, fixedVar?: FixedFlag) {
  let query = supabase
    .from('movements')
    .select(`
      amount,
      category:category_id(id, name),
      fixed_var
    `)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate);

  if (fixedVar) {
    query = query.eq('fixed_var', fixedVar);
  }

  const { data, error } = await query;

  if (error) throw error;

  const breakdown: Record<string, { name: string; total: number }> = {};

  data?.forEach((m) => {
    if (m.category) {
      const catId = m.category.id;
      if (!breakdown[catId]) {
        breakdown[catId] = { name: m.category.name, total: 0 };
      }
      breakdown[catId].total += m.amount;
    }
  });

  return Object.values(breakdown);
}
