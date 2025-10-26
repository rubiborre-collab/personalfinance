import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory, checkCategoryHasMovements } from '../../services/categories';
import type { CategoryKind } from '../../lib/database.types';

export default function CategoriesSettings() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    kind: 'expense' as CategoryKind,
    is_fixed: false,
  });
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [migrateToId, setMigrateToId] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await createCategory({
        name: formData.name,
        kind: formData.kind,
        is_fixed: formData.is_fixed,
      });
      setCreating(false);
      setFormData({ name: '', kind: 'expense', is_fixed: false });
      await loadCategories();
    } catch (error) {
      console.error('Error creando categoría:', error);
      alert('Error al crear la categoría');
    }
  }

  async function handleUpdate(id: string) {
    try {
      await updateCategory(id, {
        name: formData.name,
        kind: formData.kind,
        is_fixed: formData.is_fixed,
      });
      setEditing(null);
      await loadCategories();
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      alert('Error al actualizar la categoría');
    }
  }

  async function handleDeleteRequest(id: string, name: string) {
    const hasMovements = await checkCategoryHasMovements(id);
    if (hasMovements) {
      setDeleteModal({ id, name });
      setMigrateToId('');
    } else {
      if (confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
        await handleDelete(id);
      }
    }
  }

  async function handleDelete(id: string, migrateId?: string) {
    try {
      await deleteCategory(id, migrateId);
      setDeleteModal(null);
      await loadCategories();
    } catch (error: any) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar la categoría: ' + error.message);
    }
  }

  function startEdit(category: any) {
    setEditing(category.id);
    setFormData({
      name: category.name,
      kind: category.kind,
      is_fixed: category.is_fixed,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setCreating(false);
    setFormData({ name: '', kind: 'expense', is_fixed: false });
  }

  const incomeCategories = categories.filter(c => c.kind === 'income');
  const expenseCategories = categories.filter(c => c.kind === 'expense');

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Gestión de Categorías</h2>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-slate-800">Nueva Categoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la categoría"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as CategoryKind })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
            <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_fixed}
                onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Es fijo por defecto</span>
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
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-green-700 mb-3">Categorías de Ingresos</h3>
          <div className="space-y-2">
            {incomeCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                editing={editing}
                formData={formData}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDeleteRequest}
                onCancel={cancelEdit}
                onFormChange={setFormData}
              />
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">
                No hay categorías de ingresos
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-3">Categorías de Gastos</h3>
          <div className="space-y-2">
            {expenseCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                editing={editing}
                formData={formData}
                onEdit={startEdit}
                onUpdate={handleUpdate}
                onDelete={handleDeleteRequest}
                onCancel={cancelEdit}
                onFormChange={setFormData}
              />
            ))}
            {expenseCategories.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">
                No hay categorías de gastos
              </p>
            )}
          </div>
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">
                  Categoría con movimientos
                </h3>
                <p className="text-sm text-slate-600">
                  La categoría "{deleteModal.name}" tiene movimientos asociados.
                  Debes migrar estos movimientos a otra categoría antes de eliminarla.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Migrar movimientos a:
              </label>
              <select
                value={migrateToId}
                onChange={(e) => setMigrateToId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(c => c.id !== deleteModal.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.kind === 'income' ? 'Ingreso' : 'Gasto'})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => migrateToId && handleDelete(deleteModal.id, migrateToId)}
                disabled={!migrateToId}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Migrar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryItemProps {
  category: any;
  editing: string | null;
  formData: any;
  onEdit: (category: any) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onCancel: () => void;
  onFormChange: (data: any) => void;
}

function CategoryItem({ category, editing, formData, onEdit, onUpdate, onDelete, onCancel, onFormChange }: CategoryItemProps) {
  if (editing === category.id) {
    return (
      <div className="bg-white border border-slate-300 rounded-lg p-3 space-y-3">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_fixed}
            onChange={(e) => onFormChange({ ...formData, is_fixed: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">Es fijo por defecto</span>
        </label>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={() => onUpdate(category.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
      <div>
        <h4 className="font-medium text-slate-800">{category.name}</h4>
        {category.is_fixed && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Fijo por defecto
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(category.id, category.name)}
          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
