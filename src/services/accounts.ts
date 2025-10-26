import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export async function getAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as Account[];
}

export async function createAccount(account: Omit<AccountInsert, 'owner_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...account, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

export async function updateAccount(id: string, updates: AccountUpdate) {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Account;
}

export async function deleteAccount(id: string) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function calculateAccountBalance(accountId: string, upToDate?: string): Promise<number> {
  const { data: account } = await supabase
    .from('accounts')
    .select('opening_balance')
    .eq('id', accountId)
    .single();

  if (!account) return 0;

  const query = supabase
    .from('movements')
    .select('type, amount, account_id, account_from_id, account_to_id');

  if (upToDate) {
    query.lte('date', upToDate);
  }

  const { data: movements } = await query;

  if (!movements) return account.opening_balance;

  let balance = account.opening_balance;

  movements.forEach((m) => {
    if (m.type === 'income' && m.account_id === accountId) {
      balance += m.amount;
    } else if (m.type === 'expense' && m.account_id === accountId) {
      balance -= m.amount;
    } else if (m.type === 'transfer') {
      if (m.account_to_id === accountId) {
        balance += m.amount;
      } else if (m.account_from_id === accountId) {
        balance -= m.amount;
      }
    }
  });

  return balance;
}
