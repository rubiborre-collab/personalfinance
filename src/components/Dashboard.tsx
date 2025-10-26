import { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage, getStartOfMonth, getEndOfMonth } from '../lib/utils';
import { getMovements, getTotalsByMonth, getCategoryBreakdown, type MovementWithDetails } from '../services/movements';
import { getAccounts } from '../services/accounts';
import { getSnapshots } from '../services/snapshots';
import NetWorthChart from './charts/NetWorthChart';
import MonthlyComparisonChart from './charts/MonthlyComparisonChart';
import CategoryBreakdownChart from './charts/CategoryBreakdownChart';

interface KPIs {
  netWorth: number;
  monthIncome: number;
  monthExpense: number;
  monthBalance: number;
  fixedPercent: number;
  variablePercent: number;
}

const MONTH_OPTIONS = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 0, label: 'Todo' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recentMovements, setRecentMovements] = useState<MovementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);
  const [monthsFilter, setMonthsFilter] = useState(3);

  useEffect(() => {
    loadDashboardData();
  }, [monthsFilter]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const monthStart = getStartOfMonth(today);
      const monthEnd = getEndOfMonth(today);

      let startDateFilter: string;
      if (monthsFilter === 0) {
        startDateFilter = '2000-01-01';
      } else {
        const filterDate = new Date(today);
        filterDate.setMonth(filterDate.getMonth() - monthsFilter);
        startDateFilter = filterDate.toISOString().split('T')[0];
      }

      const allSnapshots = await getSnapshots();
      const todaySnapshots = allSnapshots.filter(s => s.date === todayStr);
      const totalNetWorth = todaySnapshots.reduce((sum, s) => sum + Number(s.balance), 0);

      const monthMovements = await getMovements({
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        includeTransfers: false,
      });

      let monthIncome = 0;
      let monthExpense = 0;
      let fixedExpense = 0;
      let variableExpense = 0;

      monthMovements.forEach((m) => {
        if (m.type === 'income') {
          monthIncome += m.amount;
        } else if (m.type === 'expense') {
          monthExpense += m.amount;
          if (m.fixed_var === 'fixed') {
            fixedExpense += m.amount;
          } else {
            variableExpense += m.amount;
          }
        }
      });

      const fixedPercent = monthExpense > 0 ? (fixedExpense / monthExpense) * 100 : 0;
      const variablePercent = monthExpense > 0 ? (variableExpense / monthExpense) * 100 : 0;

      setKpis({
        netWorth: totalNetWorth,
        monthIncome,
        monthExpense,
        monthBalance: monthIncome - monthExpense,
        fixedPercent,
        variablePercent,
      });

      const recent = await getMovements({ includeTransfers: false });
      setRecentMovements(recent.slice(0, 10));

      setChartKey(prev => prev + 1);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <select
          value={monthsFilter}
          onChange={(e) => setMonthsFilter(Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTH_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Patrimonio Total"
          value={formatCurrency(kpis.netWorth)}
          icon={<Wallet className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatCurrency(kpis.monthIncome)}
          icon={<ArrowUpCircle className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Gastos del Mes"
          value={formatCurrency(kpis.monthExpense)}
          icon={<ArrowDownCircle className="w-6 h-6" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Gastos Fijos vs Variables</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Fijos</span>
                <span className="text-sm font-medium text-slate-800">{formatPercentage(kpis.fixedPercent)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${kpis.fixedPercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Variables</span>
                <span className="text-sm font-medium text-slate-800">{formatPercentage(kpis.variablePercent)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-teal-600 h-3 rounded-full transition-all"
                  style={{ width: `${kpis.variablePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ingresos y Gastos del Mes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Ingresos</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(kpis.monthIncome)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Gastos</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(kpis.monthExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthChart key={`networth-${chartKey}`} months={monthsFilter} />
        <MonthlyComparisonChart key={`monthly-${chartKey}`} months={monthsFilter} />
      </div>

      <CategoryBreakdownChart key={`category-${chartKey}`} months={monthsFilter} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Últimos Movimientos</h3>
        <div className="space-y-3">
          {recentMovements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  movement.type === 'income' ? 'bg-green-100' :
                  movement.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {movement.type === 'income' ? <ArrowUpCircle className="w-5 h-5 text-green-600" /> :
                   movement.type === 'expense' ? <ArrowDownCircle className="w-5 h-5 text-red-600" /> :
                   <Minus className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {movement.category?.name || 'Transferencia'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(movement.date).toLocaleDateString('es-ES')} • {movement.account?.name || `${movement.account_from?.name} → ${movement.account_to?.name}`}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${
                movement.type === 'income' ? 'text-green-600' :
                movement.type === 'expense' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {movement.type === 'income' ? '+' : movement.type === 'expense' ? '-' : ''}
                {formatCurrency(movement.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red';
}

function KPICard({ title, value, subtitle, icon, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
