import { supabase } from '../lib/supabase';

export async function seedUserData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase.rpc('seed_user_data', {
    user_id: user.id,
  });

  if (error) throw error;
  return data;
}

export async function checkNeedsSeeding(): Promise<boolean> {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .limit(1);

  return !accounts || accounts.length === 0;
}
