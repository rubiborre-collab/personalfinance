import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../../services/accounts';
import { formatCurrency } from '../../lib/utils';
import type { AccountType } from '../../lib/database.types';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Banco' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'broker', label: 'Broker' },
  { value: 'roboadvisor', label: 'Roboadvisor' },
  { value: 'ewallet', label: 'Monedero Electrónico' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' },
];

export default function AccountsSettings() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as AccountType,
    opening_balance: '0',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await createAccount({
        name: formData.name,
        type: formData.type,
        opening_balance: parseFloat(formData.opening_balance),
      });
      setCreating(false);
      setFormData({ name: '', type: 'bank', opening_balance: '0' });
      await loadAccounts();
    } catch (error) {
      console.error('Error creando cuenta:', error);
      alert('Error al crear la cuenta');
    }
  }

  async function handleUpdate(id: string) {
    try {
      await updateAccount(id, {
        name: formData.name,
        type: formData.type,
        opening_balance: parseFloat(formData.opening_balance),
      });
      setEditing(null);
      await loadAccounts();
    } catch (error) {
      console.error('Error actualizando cuenta:', error);
      alert('Error al actualizar la cuenta');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeleting(id);
      await deleteAccount(id);
      await loadAccounts();
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      alert('Error al eliminar la cuenta: ' + error.message);
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(account: any) {
    setEditing(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      opening_balance: account.opening_balance.toString(),
    });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setFormData({ name: '', type: 'bank', opening_balance: '0' });
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando cuentas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Gestión de Cuentas</h2>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-slate-800">Nueva Cuenta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la cuenta"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
              placeholder="Saldo inicial"
              step="0.01"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {accounts.map((account) => (
          <div key={account.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            {editing === account.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    step="0.01"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleUpdate(account.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{account.name}</h3>
                  <div className="flex gap-4 mt-1 text-sm text-slate-600">
                    <span>{ACCOUNT_TYPES.find(t => t.value === account.type)?.label}</span>
                    <span>Saldo inicial: {formatCurrency(account.opening_balance)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(account)}
                    disabled={deleting === account.id}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    disabled={deleting === account.id}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting === account.id ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No tienes cuentas registradas
        </div>
      )}
    </div>
  );
}
