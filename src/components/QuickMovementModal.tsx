import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getAccounts } from '../services/accounts';
import { getCategories } from '../services/categories';
import { createMovement } from '../services/movements';
import { formatDateForInput } from '../lib/utils';
import type { CategoryKind, FixedFlag } from '../lib/database.types';

interface QuickMovementModalProps {
  type: 'income' | 'expense';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickMovementModal({ type, isOpen, onClose, onSuccess }: QuickMovementModalProps) {
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [fixedVar, setFixedVar] = useState<FixedFlag>('variable');
  const [note, setNote] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
      setDate(formatDateForInput(new Date()));
      setAmount('');
      setAccountId('');
      setCategoryId('');
      setCategorySearch('');
      setNote('');
      setError('');
    }
  }, [isOpen, type]);

  useEffect(() => {
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categorySearch, categories]);

  useEffect(() => {
    if (categoryId) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setFixedVar(category.is_fixed ? 'fixed' : 'variable');
      }
    }
  }, [categoryId, categories]);

  async function loadData() {
    try {
      const [accts, cats] = await Promise.all([
        getAccounts(),
        getCategories(type as CategoryKind),
      ]);
      setAccounts(accts);
      setCategories(cats);
      setFilteredCategories(cats);

      if (accts.length > 0) {
        setAccountId(accts[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar las opciones');
    }
  }

  async function handleSubmit(continueAdding: boolean = false) {
    if (!amount || !accountId || !categoryId) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createMovement({
        date,
        type,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId,
        fixed_var: fixedVar,
        note: note || null,
      });

      if (continueAdding) {
        setAmount('');
        setCategoryId('');
        setCategorySearch('');
        setNote('');
        setError('');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el movimiento');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const title = type === 'income' ? 'Ingreso Rápido' : 'Gasto Rápido';
  const bgColor = type === 'income' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`${bgColor} text-white p-6 flex items-center justify-between rounded-t-2xl`}>
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cuenta <span className="text-red-500">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona una cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Categoría <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Buscar categoría..."
              />
            </div>
            {filteredCategories.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(category.id);
                      setCategorySearch(category.name);
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                      categoryId === category.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFixedVar('fixed')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  fixedVar === 'fixed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fijo
              </button>
              <button
                type="button"
                onClick={() => setFixedVar('variable')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  fixedVar === 'variable'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Variable
              </button>
            </div>
          </div>

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
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className={`flex-1 px-4 py-2.5 ${bgColor} hover:opacity-90 text-white font-medium rounded-lg transition-opacity disabled:opacity-50`}
              disabled={loading}
            >
              Guardar y Seguir
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className={`flex-1 px-4 py-2.5 ${bgColor} hover:opacity-90 text-white font-medium rounded-lg transition-opacity disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
