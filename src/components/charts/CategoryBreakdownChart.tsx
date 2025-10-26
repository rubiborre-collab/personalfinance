import { useEffect, useState } from 'react';
import { getCategoryBreakdown } from '../../services/movements';
import { formatCurrency, getStartOfMonth, getEndOfMonth, addMonths } from '../../lib/utils';
import type { FixedFlag } from '../../lib/database.types';

interface CategoryData {
  name: string;
  total: number;
  percentage: number;
  color: string;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

interface CategoryBreakdownChartProps {
  months?: number;
}

export default function CategoryBreakdownChart({ months = 3 }: CategoryBreakdownChartProps) {
  const [data, setData] = useState<CategoryData[]>([]);
  const [filter, setFilter] = useState<FixedFlag | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter, months]);

  async function loadData() {
    try {
      setLoading(true);
      const today = new Date();
      const endDate = getEndOfMonth(today).toISOString().split('T')[0];

      let startDate: string;
      if (months === 0) {
        startDate = '2000-01-01';
      } else {
        const filterDate = addMonths(today, -months);
        startDate = getStartOfMonth(filterDate).toISOString().split('T')[0];
      }

      const breakdown = await getCategoryBreakdown(
        startDate,
        endDate,
        filter === 'all' ? undefined : filter
      );

      const total = breakdown.reduce((sum, cat) => sum + cat.total, 0);

      const chartData: CategoryData[] = breakdown
        .map((cat, index) => ({
          name: cat.name,
          total: cat.total,
          percentage: total > 0 ? (cat.total / total) * 100 : 0,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.total - a.total);

      setData(chartData);
    } catch (error) {
      console.error('Error cargando desglose por categoría:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Gastos por Categoría</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">Cargando...</div>
      </div>
    );
  }

  const total = data.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Gastos por Categoría</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('fixed')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'fixed'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fijos
          </button>
          <button
            onClick={() => setFilter('variable')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'variable'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Variables
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No hay gastos en este periodo
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {data.reduce((acc, cat, index) => {
                  const prevPercentage = data.slice(0, index).reduce((sum, c) => sum + c.percentage, 0);
                  const strokeDasharray = `${cat.percentage} ${100 - cat.percentage}`;
                  const strokeDashoffset = -prevPercentage;

                  acc.push(
                    <circle
                      key={cat.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all hover:opacity-80 cursor-pointer"
                    />
                  );
                  return acc;
                }, [] as JSX.Element[])}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</p>
                <p className="text-sm text-slate-500">Total</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-slate-700 truncate">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(cat.total)}</p>
                  <p className="text-xs text-slate-500">{cat.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
