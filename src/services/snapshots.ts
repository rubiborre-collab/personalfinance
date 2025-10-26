import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Snapshot = Database['public']['Tables']['snapshots']['Row'];
type SnapshotInsert = Database['public']['Tables']['snapshots']['Insert'];

export async function getSnapshots(accountId?: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('snapshots')
    .select('*');

  if (accountId) {
    query = query.eq('account_id', accountId);
  }
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query.order('date', { ascending: true });

  if (error) throw error;
  return data as Snapshot[];
}

export async function getLatestSnapshot(accountId: string): Promise<Snapshot | null> {
  const { data, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSnapshot(snapshot: Omit<SnapshotInsert, 'owner_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('snapshots')
    .insert({ ...snapshot, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Snapshot;
}

export async function updateSnapshot(id: string, balance: number) {
  const { data, error } = await supabase
    .from('snapshots')
    .update({ balance })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Snapshot;
}

export async function deleteSnapshot(id: string) {
  const { error } = await supabase
    .from('snapshots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTotalNetWorth(date?: string): Promise<number> {
  let query = supabase
    .from('snapshots')
    .select('account_id, balance, date');

  if (date) {
    query = query.lte('date', date);
  }

  const { data, error } = await query;

  if (error) throw error;

  const latestByAccount: Record<string, number> = {};

  data?.forEach((s) => {
    if (!latestByAccount[s.account_id] || s.date > data.find(x => x.account_id === s.account_id)!.date) {
      latestByAccount[s.account_id] = s.balance;
    }
  });

  return Object.values(latestByAccount).reduce((sum, balance) => sum + balance, 0);
}
