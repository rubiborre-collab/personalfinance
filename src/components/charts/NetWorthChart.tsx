import { useEffect, useState } from 'react';
import { getAccounts } from '../../services/accounts';
import { getSnapshots } from '../../services/snapshots';
import { formatCurrency, getStartOfMonth, addMonths } from '../../lib/utils';

interface ChartData {
  date: string;
  total: number;
  byAccount: Record<string, number>;
}

interface NetWorthChartProps {
  months?: number;
}

export default function NetWorthChart({ months = 3 }: NetWorthChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [months]);

  async function loadData() {
    try {
      setLoading(true);
      const accts = await getAccounts();
      setAccounts(accts);

      const today = new Date();
      let startDate: Date;

      if (months === 0) {
        startDate = new Date('2000-01-01');
      } else {
        startDate = addMonths(today, -months);
      }

      const snapshots = await getSnapshots(
        undefined,
        startDate.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );

      const dateMap: Record<string, ChartData> = {};

      snapshots.forEach((s) => {
        if (!dateMap[s.date]) {
          dateMap[s.date] = { date: s.date, total: 0, byAccount: {} };
        }
        dateMap[s.date].byAccount[s.account_id] = s.balance;
        dateMap[s.date].total += s.balance;
      });

      const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
      setData(chartData);
    } catch (error) {
      console.error('Error cargando gráfico de patrimonio:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolución del Patrimonio</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">Cargando...</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.total), 0);
  const minValue = Math.min(...data.map(d => d.total), 0);
  const range = maxValue - minValue || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Evolución del Patrimonio</h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No hay datos de snapshots para este periodo
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-64 flex items-end justify-between gap-2">
            {data.map((item, index) => {
              const height = ((item.total - minValue) / range) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer relative group"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
            {accounts.map((account, index) => (
              <div key={account.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: `hsl(${(index * 360) / accounts.length}, 70%, 50%)`,
                  }}
                />
                <span className="text-sm text-slate-600">{account.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
