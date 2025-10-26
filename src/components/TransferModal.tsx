import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { getAccounts } from '../services/accounts';
import { createMovement } from '../services/movements';
import { formatDateForInput } from '../lib/utils';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [amount, setAmount] = useState('');
  const [accountFromId, setAccountFromId] = useState('');
  const [accountToId, setAccountToId] = useState('');
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setDate(formatDateForInput(new Date()));
      setAmount('');
      setAccountFromId('');
      setAccountToId('');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  async function loadAccounts() {
    try {
      const accts = await getAccounts();
      setAccounts(accts);
      if (accts.length >= 2) {
        setAccountFromId(accts[0].id);
        setAccountToId(accts[1].id);
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error);
      setError('Error al cargar las cuentas');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || !accountFromId || !accountToId) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (accountFromId === accountToId) {
      setError('La cuenta de origen y destino no pueden ser la misma');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createMovement({
        date,
        type: 'transfer',
        amount: parseFloat(amount),
        account_from_id: accountFromId,
        account_to_id: accountToId,
        note: note || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear la transferencia');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="bg-blue-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">Nueva Transferencia</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Importe (EUR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Desde <span className="text-red-500">*</span>
              </label>
              <select
                value={accountFromId}
                onChange={(e) => setAccountFromId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hacia <span className="text-red-500">*</span>
              </label>
              <select
                value={accountToId}
                onChange={(e) => setAccountToId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id} disabled={account.id === accountFromId}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {accountFromId && accountToId && accountFromId !== accountToId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-3 text-sm text-blue-800">
                <span className="font-medium">
                  {accounts.find(a => a.id === accountFromId)?.name}
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className="font-medium">
                  {accounts.find(a => a.id === accountToId)?.name}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Añade una nota..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Crear Transferencia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
