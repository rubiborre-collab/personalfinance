import { useEffect, useState } from 'react';
import { getTotalsByMonth } from '../../services/movements';
import { formatCurrency } from '../../lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface MonthlyComparisonChartProps {
  months?: number;
}

export default function MonthlyComparisonChart({ months = 3 }: MonthlyComparisonChartProps) {
  const [data, setData] = useState<Record<number, { income: number; expense: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [months]);

  async function loadData() {
    try {
      setLoading(true);
      const year = new Date().getFullYear();
      const totals = await getTotalsByMonth(year);
      console.log('MonthlyComparisonChart data:', totals);
      setData(totals);
    } catch (error) {
      console.error('Error cargando comparación mensual:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Ingresos vs Gastos Mensuales</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">Cargando...</div>
      </div>
    );
  }

  const hasData = Object.values(data).some(d => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Ingresos vs Gastos Mensuales</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No hay datos de ingresos o gastos este año
        </div>
      </div>
    );
  }

  const allValues = Object.values(data).flatMap(d => [d.income, d.expense]).filter(v => v > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1000;

  const paddedMax = maxValue * 1.3;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Ingresos vs Gastos Mensuales</h3>

      <div className="h-64 flex items-end justify-between gap-3">
        {MONTHS.map((month, index) => {
          const monthData = data[index] || { income: 0, expense: 0 };
          const incomeHeight = Math.max((monthData.income / paddedMax) * 100, monthData.income > 0 ? 5 : 0);
          const expenseHeight = Math.max((monthData.expense / paddedMax) * 100, monthData.expense > 0 ? 5 : 0);

          return (
            <div key={month} className="flex-1 flex flex-col items-center">
              <div className="w-full flex gap-1 justify-center items-end h-full">
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${incomeHeight}%` }}
                  >
                    {monthData.income > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(monthData.income)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer relative group"
                    style={{ height: `${expenseHeight}%` }}
                  >
                    {monthData.expense > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(monthData.expense)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{month}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 pt-4 mt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-sm text-slate-600">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-sm text-slate-600">Gastos</span>
        </div>
      </div>
    </div>
  );
}
