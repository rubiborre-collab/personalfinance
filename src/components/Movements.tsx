import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Repeat, Edit2, Trash2, Filter, Download, Upload } from 'lucide-react';
import { getMovements, deleteMovement, type MovementWithDetails, type MovementFilters } from '../services/movements';
import { getAccounts } from '../services/accounts';
import { getCategories } from '../services/categories';
import { formatCurrency, formatDate, formatDateForInput } from '../lib/utils';
import type { MovementType, FixedFlag } from '../lib/database.types';

interface MovementsProps {
  onEdit?: (movement: MovementWithDetails) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export default function Movements({ onEdit, onExport, onImport }: MovementsProps) {
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<MovementFilters>({
    includeTransfers: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [filters]);

  async function loadData() {
    try {
      const [accts, cats] = await Promise.all([
        getAccounts(),
        getCategories(),
      ]);
      setAccounts(accts);
      setCategories(cats);
      await loadMovements();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  async function loadMovements() {
    try {
      setLoading(true);
      const data = await getMovements(filters);
      setMovements(data);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;

    try {
      await deleteMovement(id);
      await loadMovements();
    } catch (error) {
      console.error('Error eliminando movimiento:', error);
      alert('Error al eliminar el movimiento');
    }
  }

  function getMovementIcon(type: MovementType) {
    if (type === 'income') return <ArrowUpCircle className="w-5 h-5 text-green-600" />;
    if (type === 'expense') return <ArrowDownCircle className="w-5 h-5 text-red-600" />;
    return <Repeat className="w-5 h-5 text-blue-600" />;
  }

  function getMovementColor(type: MovementType) {
    if (type === 'income') return 'text-green-600';
    if (type === 'expense') return 'text-red-600';
    return 'text-blue-600';
  }

  function getAccountName(movement: MovementWithDetails) {
    if (movement.type === 'transfer') {
      return `${movement.account_from?.name} → ${movement.account_to?.name}`;
    }
    return movement.account?.name || '-';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Movimientos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          {onImport && (
            <button
              onClick={onImport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as MovementType || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="income">Ingresos</option>
                <option value="expense">Gastos</option>
                <option value="transfer">Transferencias</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cuenta</label>
              <select
                value={filters.accountId || ''}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fijo/Variable</label>
              <select
                value={filters.fixedVar || ''}
                onChange={(e) => setFilters({ ...filters, fixedVar: e.target.value as FixedFlag || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="fixed">Fijos</option>
                <option value="variable">Variables</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeTransfers !== false}
                  onChange={(e) => setFilters({ ...filters, includeTransfers: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Incluir transferencias</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ includeTransfers: true })}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Cargando movimientos...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No hay movimientos que mostrar</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Fijo/Var
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {formatDate(movement.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <span className="text-sm text-slate-700 capitalize">
                          {movement.type === 'income' ? 'Ingreso' : movement.type === 'expense' ? 'Gasto' : 'Transferencia'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div>
                        <p className="font-medium">{movement.category?.name || 'Transferencia'}</p>
                        {movement.note && <p className="text-xs text-slate-500 mt-1">{movement.note}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {getAccountName(movement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {movement.fixed_var ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          movement.fixed_var === 'fixed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {movement.fixed_var === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${getMovementColor(movement.type)}`}>
                      {movement.type === 'income' ? '+' : movement.type === 'expense' ? '-' : ''}
                      {formatCurrency(movement.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(movement)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(movement.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Mostrando {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-slate-600">Ingresos: </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0))}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Gastos: </span>
              <span className="font-semibold text-red-600">
                {formatCurrency(movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
