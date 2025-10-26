import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAccounts } from '../../services/accounts';
import { getCategories } from '../../services/categories';
import { formatCurrency } from '../../lib/utils';
import type { MovementType, FixedFlag, CategoryKind } from '../../lib/database.types';

interface RecurringTemplate {
  id: string;
  name: string;
  type: MovementType;
  amount: number;
  day_of_month: number;
  account_id: string;
  category_id: string;
  fixed_var: FixedFlag | null;
  note: string | null;
  active: boolean;
}

export default function RecurringSettings() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as MovementType,
    amount: '',
    day_of_month: '1',
    account_id: '',
    category_id: '',
    fixed_var: 'fixed' as FixedFlag,
    note: '',
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [templatesData, accountsData, categoriesData] = await Promise.all([
        loadTemplates(),
        getAccounts(),
        getCategories(),
      ]);

      setTemplates(templatesData);
      setAccounts(accountsData);
      setCategories(categoriesData);

      if (accountsData.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accountsData[0].id }));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as RecurringTemplate[];
  }

  async function handleCreate() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('recurring_templates')
        .insert({
          owner_id: user.id,
          name: formData.name,
          type: formData.type,
          amount: parseFloat(formData.amount),
          day_of_month: parseInt(formData.day_of_month),
          account_id: formData.account_id,
          category_id: formData.category_id,
          fixed_var: formData.fixed_var,
          note: formData.note || null,
          active: formData.active,
        });

      if (error) throw error;

      setCreating(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error creando plantilla:', error);
      alert('Error al crear la plantilla recurrente');
    }
  }

  async function handleUpdate(id: string) {
    try {
      const { error } = await supabase
        .from('recurring_templates')
        .update({
          name: formData.name,
          type: formData.type,
          amount: parseFloat(formData.amount),
          day_of_month: parseInt(formData.day_of_month),
          account_id: formData.account_id,
          category_id: formData.category_id,
          fixed_var: formData.fixed_var,
          note: formData.note || null,
          active: formData.active,
        })
        .eq('id', id);

      if (error) throw error;

      setEditing(null);
      await loadData();
    } catch (error) {
      console.error('Error actualizando plantilla:', error);
      alert('Error al actualizar la plantilla');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta plantilla recurrente?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('recurring_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error eliminando plantilla:', error);
      alert('Error al eliminar la plantilla');
    }
  }

  function startEdit(template: RecurringTemplate) {
    setEditing(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      amount: template.amount.toString(),
      day_of_month: template.day_of_month.toString(),
      account_id: template.account_id,
      category_id: template.category_id,
      fixed_var: template.fixed_var || 'variable',
      note: template.note || '',
      active: template.active,
    });
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'expense',
      amount: '',
      day_of_month: '1',
      account_id: accounts[0]?.id || '',
      category_id: '',
      fixed_var: 'fixed',
      note: '',
      active: true,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    resetForm();
  }

  function getAccountName(id: string) {
    return accounts.find(a => a.id === id)?.name || '-';
  }

  function getCategoryName(id: string) {
    return categories.find(c => c.id === id)?.name || '-';
  }

  const filteredCategories = categories.filter(c =>
    formData.type === 'transfer' ? false : c.kind === formData.type
  );

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando plantillas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Plantillas Recurrentes</h2>
          <p className="text-sm text-slate-600 mt-1">
            Crea plantillas para movimientos que se repiten mensualmente
          </p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-slate-800">Nueva Plantilla Recurrente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre (ej: Alquiler mensual)"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MovementType })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Importe"
              step="0.01"
              min="0.01"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.day_of_month}
              onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Día {day} del mes</option>
              ))}
            </select>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona cuenta</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona categoría</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={formData.fixed_var}
              onChange={(e) => setFormData({ ...formData, fixed_var: e.target.value as FixedFlag })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fixed">Fijo</option>
              <option value="variable">Variable</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Activa</span>
            </label>
          </div>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Nota (opcional)"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
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
        {templates.map((template) => (
          <div key={template.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            {editing === template.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    step="0.01"
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Día {day}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Activa</span>
                  </label>
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
                    onClick={() => handleUpdate(template.id)}
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
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-800">{template.name}</h3>
                    {!template.active && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-200 text-slate-600 rounded">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-slate-600">
                    <span className={template.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {template.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                    <span className="font-medium">{formatCurrency(template.amount)}</span>
                    <span>Día {template.day_of_month}</span>
                    <span>{getCategoryName(template.category_id)}</span>
                    <span>{getAccountName(template.account_id)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(template)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No tienes plantillas recurrentes configuradas
        </div>
      )}
    </div>
  );
}
