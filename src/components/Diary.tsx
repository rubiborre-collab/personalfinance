import { useEffect, useState } from 'react';
import { Save, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { getMovements, type MovementWithDetails } from '../services/movements';
import { getDayNote, upsertDayNote } from '../services/diary';
import { formatCurrency, formatDate, formatDateForInput, addDays } from '../lib/utils';

interface DayEntry {
  date: string;
  income: number;
  expense: number;
  balance: number;
  movements: MovementWithDetails[];
  note: string | null;
}

export default function Diary() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const today = new Date();
  const defaultStartDate = addDays(today, -30);

  const [startDate, setStartDate] = useState(formatDateForInput(defaultStartDate));
  const [endDate, setEndDate] = useState(formatDateForInput(today));
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDiary();
  }, [startDate, endDate]);

  async function loadDiary() {
    try {
      setLoading(true);

      const movements = await getMovements({
        startDate: startDate,
        endDate: endDate,
        includeTransfers: false,
      });

      const dayMap: Record<string, DayEntry> = {};

      movements.forEach((m) => {
        if (!dayMap[m.date]) {
          dayMap[m.date] = {
            date: m.date,
            income: 0,
            expense: 0,
            balance: 0,
            movements: [],
            note: null,
          };
        }

        dayMap[m.date].movements.push(m);

        if (m.type === 'income') {
          dayMap[m.date].income += m.amount;
        } else if (m.type === 'expense') {
          dayMap[m.date].expense += m.amount;
        }
      });

      Object.values(dayMap).forEach((entry) => {
        entry.balance = entry.income - entry.expense;
      });

      const sortedEntries = Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));

      for (const entry of sortedEntries) {
        const note = await getDayNote(entry.date);
        entry.note = note?.note || null;
      }

      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error cargando diario:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote(date: string) {
    try {
      setSavingNote(true);
      await upsertDayNote(date, noteValue.trim() || null);

      setEntries(entries.map(e =>
        e.date === date ? { ...e, note: noteValue.trim() || null } : e
      ));

      setEditingNote(null);
      setNoteValue('');
    } catch (error) {
      console.error('Error guardando nota:', error);
      alert('Error al guardar la nota');
    } finally {
      setSavingNote(false);
    }
  }

  function handleEditNote(date: string, currentNote: string | null) {
    setEditingNote(date);
    setNoteValue(currentNote || '');
  }

  function handleCancelEdit() {
    setEditingNote(null);
    setNoteValue('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando diario...</div>
      </div>
    );
  }

  function handleQuickFilter(days: number) {
    const end = new Date();
    const start = addDays(end, -days);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Diario</h1>
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
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Filtrar por fechas</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => handleQuickFilter(90)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Últimos 3 meses
            </button>
            <button
              onClick={() => handleQuickFilter(365)}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              Último año
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay movimientos en los últimos 30 días</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.date} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    {formatDate(entry.date)}
                  </h2>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Ingresos</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(entry.income)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Gastos</p>
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(entry.expense)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Balance</p>
                      <p className={`text-sm font-bold ${
                        entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(entry.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Movimientos ({entry.movements.length})
                  </h3>
                  <div className="space-y-2">
                    {entry.movements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {movement.category?.name}
                          </p>
                          <div className="flex gap-3 mt-1">
                            <p className="text-xs text-slate-500">
                              {movement.account?.name}
                            </p>
                            {movement.fixed_var && (
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                movement.fixed_var === 'fixed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-teal-100 text-teal-700'
                              }`}>
                                {movement.fixed_var === 'fixed' ? 'Fijo' : 'Variable'}
                              </span>
                            )}
                          </div>
                          {movement.note && (
                            <p className="text-xs text-slate-600 mt-1">{movement.note}</p>
                          )}
                        </div>
                        <p className={`text-sm font-bold ${
                          movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'income' ? '+' : '-'}
                          {formatCurrency(movement.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Nota del día
                    </h3>
                    {editingNote !== entry.date && (
                      <button
                        onClick={() => handleEditNote(entry.date, entry.note)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {entry.note ? 'Editar' : 'Añadir nota'}
                      </button>
                    )}
                  </div>

                  {editingNote === entry.date ? (
                    <div className="space-y-3">
                      <textarea
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={4}
                        placeholder="Escribe una nota para este día..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                          disabled={savingNote}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveNote(entry.date)}
                          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                          disabled={savingNote}
                        >
                          <Save className="w-4 h-4" />
                          {savingNote ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : entry.note ? (
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                      {entry.note}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sin nota</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
