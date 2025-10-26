import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getMovementsByDate, getMovements } from '../services/movements';
import { formatCurrency, formatDate, getDaysInMonth, addMonths } from '../lib/utils';
import type { MovementWithDetails } from '../services/movements';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface DayData {
  date: Date;
  income: number;
  expense: number;
  count: number;
  isCurrentMonth: boolean;
}

interface CalendarProps {
  onAddMovement?: (date: string) => void;
}

export default function Calendar({ onAddMovement }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [dayMovements, setDayMovements] = useState<MovementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

  async function generateCalendar() {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const firstDay = new Date(year, month, 1);
      let dayOfWeek = firstDay.getDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const daysInMonth = getDaysInMonth(currentDate);
      const daysInPrevMonth = getDaysInMonth(new Date(year, month - 1, 1));

      const days: DayData[] = [];

      for (let i = dayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPrevMonth - i);
        days.push({
          date,
          income: 0,
          expense: 0,
          count: 0,
          isCurrentMonth: false,
        });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push({
          date,
          income: 0,
          expense: 0,
          count: 0,
          isCurrentMonth: true,
        });
      }

      const remainingDays = 42 - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
          date,
          income: 0,
          expense: 0,
          count: 0,
          isCurrentMonth: false,
        });
      }

      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const movements = await getMovements({ startDate, endDate, includeTransfers: false });

      const movementsByDate = new Map<string, { income: number; expense: number; count: number }>();
      movements.forEach(m => {
        const dateStr = m.date;
        if (!movementsByDate.has(dateStr)) {
          movementsByDate.set(dateStr, { income: 0, expense: 0, count: 0 });
        }
        const data = movementsByDate.get(dateStr)!;
        if (m.type === 'income') {
          data.income += m.amount;
        } else if (m.type === 'expense') {
          data.expense += m.amount;
        }
        data.count++;
      });

      days.forEach(day => {
        const dateStr = day.date.toISOString().split('T')[0];
        const data = movementsByDate.get(dateStr);
        if (data) {
          day.income = data.income;
          day.expense = data.expense;
          day.count = data.count;
        }
      });

      setCalendarDays(days);
    } catch (error) {
      console.error('Error generando calendario:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDayClick(day: DayData) {
    setSelectedDay(day);
    try {
      const dateStr = day.date.toISOString().split('T')[0];
      const movements = await getMovementsByDate(dateStr);
      setDayMovements(movements.filter(m => m.type !== 'transfer'));

      const income = movements
        .filter(m => m.type === 'income')
        .reduce((sum, m) => sum + m.amount, 0);
      const expense = movements
        .filter(m => m.type === 'expense')
        .reduce((sum, m) => sum + m.amount, 0);

      setSelectedDay({
        ...day,
        income,
        expense,
        count: movements.filter(m => m.type !== 'transfer').length,
      });
    } catch (error) {
      console.error('Error cargando movimientos del día:', error);
    }
  }

  function previousMonth() {
    setCurrentDate(addMonths(currentDate, -1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDay(null);
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDay(null);
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Calendario</h1>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Hoy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">Cargando...</div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square p-2 rounded-lg border transition-all ${
                        !day.isCurrentMonth
                          ? 'bg-slate-50 border-slate-100 text-slate-400'
                          : isToday(day.date)
                          ? 'bg-blue-600 border-blue-600 text-white font-bold'
                          : selectedDay?.date.toDateString() === day.date.toDateString()
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <span className="text-sm font-medium mb-auto">
                          {day.date.getDate()}
                        </span>
                        {day.isCurrentMonth && day.count > 0 && (
                          <div className="flex flex-col gap-0.5 mt-1">
                            {day.income > 0 && (
                              <div className={`h-1 rounded-full ${isToday(day.date) ? 'bg-green-200' : 'bg-green-500'}`} />
                            )}
                            {day.expense > 0 && (
                              <div className={`h-1 rounded-full ${isToday(day.date) ? 'bg-red-200' : 'bg-red-500'}`} />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  {formatDate(selectedDay.date)}
                </h3>
                {onAddMovement && (
                  <button
                    onClick={() => onAddMovement(selectedDay.date.toISOString().split('T')[0])}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Agregar movimiento"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Ingresos</span>
                  <span className="text-sm font-bold text-green-700">
                    {formatCurrency(selectedDay.income)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-700">Gastos</span>
                  <span className="text-sm font-bold text-red-700">
                    {formatCurrency(selectedDay.expense)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Balance</span>
                  <span className={`text-sm font-bold ${
                    selectedDay.income - selectedDay.expense >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(selectedDay.income - selectedDay.expense)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Movimientos ({dayMovements.length})
                </h4>
                {dayMovements.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay movimientos este día
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dayMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-slate-800">
                            {movement.category?.name}
                          </p>
                          <p className={`text-sm font-bold ${
                            movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.type === 'income' ? '+' : '-'}
                            {formatCurrency(movement.amount)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {movement.account?.name}
                        </p>
                        {movement.note && (
                          <p className="text-xs text-slate-600 mt-1">{movement.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <p className="text-slate-500 text-center py-12">
                Selecciona un día para ver los detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
