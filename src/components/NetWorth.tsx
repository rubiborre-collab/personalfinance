import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { getAccounts } from '../services/accounts';
import { getSnapshots, createSnapshot, updateSnapshot, deleteSnapshot, getLatestSnapshot } from '../services/snapshots';
import { formatCurrency, formatDate, formatDateForInput } from '../lib/utils';

interface AccountWithSnapshot {
  id: string;
  name: string;
  latestSnapshot: any | null;
}

export default function NetWorth() {
  const [accounts, setAccounts] = useState<AccountWithSnapshot[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSnapshot, setAddingSnapshot] = useState<string | null>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [snapshotForm, setSnapshotForm] = useState({
    date: formatDateForInput(new Date()),
    balance: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const accountsData = await getAccounts();
      const snapshotsData = await getSnapshots();
      setSnapshots(snapshotsData);

      const accountsWithSnapshots: AccountWithSnapshot[] = [];

      for (const account of accountsData) {
        const latestSnapshot = await getLatestSnapshot(account.id);
        accountsWithSnapshots.push({
          id: account.id,
          name: account.name,
          latestSnapshot,
        });
      }

      setAccounts(accountsWithSnapshots);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSnapshot(accountId: string) {
    try {
      await createSnapshot({
        account_id: accountId,
        date: snapshotForm.date,
        balance: parseFloat(snapshotForm.balance),
      });

      setAddingSnapshot(null);
      setSnapshotForm({ date: formatDateForInput(new Date()), balance: '' });
      await loadData();
    } catch (error: any) {
      console.error('Error creando snapshot:', error);
      if (error.message?.includes('duplicate')) {
        alert('Ya existe un snapshot para esta cuenta en esta fecha');
      } else {
        alert('Error al crear el snapshot');
      }
    }
  }

  async function handleUpdateSnapshot(id: string) {
    try {
      await updateSnapshot(id, parseFloat(snapshotForm.balance));
      setEditingSnapshot(null);
      setSnapshotForm({ date: formatDateForInput(new Date()), balance: '' });
      await loadData();
    } catch (error) {
      console.error('Error actualizando snapshot:', error);
      alert('Error al actualizar el snapshot');
    }
  }

  async function handleDeleteSnapshot(id: string) {
    if (!confirm('¿Estás seguro de eliminar este snapshot?')) return;

    try {
      await deleteSnapshot(id);
      await loadData();
    } catch (error) {
      console.error('Error eliminando snapshot:', error);
      alert('Error al eliminar el snapshot');
    }
  }

  function startAddSnapshot(accountId: string) {
    setAddingSnapshot(accountId);
    setSnapshotForm({
      date: formatDateForInput(new Date()),
      balance: '',
    });
  }

  function startEditSnapshot(snapshot: any) {
    setEditingSnapshot(snapshot.id);
    setSnapshotForm({
      date: snapshot.date,
      balance: snapshot.balance.toString(),
    });
  }

  function cancelForm() {
    setAddingSnapshot(null);
    setEditingSnapshot(null);
    setSnapshotForm({ date: formatDateForInput(new Date()), balance: '' });
  }

  const accountsWithSnapshots = accounts.filter(acc => acc.latestSnapshot);
  const totalNetWorth = accountsWithSnapshots.reduce((sum, acc) => sum + (acc.latestSnapshot?.balance || 0), 0);

  const groupedSnapshots: Record<string, any[]> = {};
  snapshots.forEach((s) => {
    if (!groupedSnapshots[s.date]) {
      groupedSnapshots[s.date] = [];
    }
    groupedSnapshots[s.date].push(s);
  });

  const sortedDates = Object.keys(groupedSnapshots).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Patrimonio</h1>
      </div>

      {accountsWithSnapshots.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-600 mb-1">Patrimonio Total</p>
          <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalNetWorth)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Última actualización: {formatDate(accountsWithSnapshots[0].latestSnapshot?.date)}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Cuentas</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {accounts.map((account) => (
            <div key={account.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">{account.name}</h3>

                  {account.latestSnapshot && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-600">
                        Último Snapshot: {formatDate(account.latestSnapshot.date)}
                      </p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {formatCurrency(account.latestSnapshot.balance)}
                      </p>
                    </div>
                  )}
                </div>

                {addingSnapshot !== account.id && (
                  <button
                    onClick={() => startAddSnapshot(account.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Snapshot
                  </button>
                )}
              </div>

              {addingSnapshot === account.id && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-slate-800">Nuevo Snapshot</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={snapshotForm.date}
                        onChange={(e) => setSnapshotForm({ ...snapshotForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Saldo Real
                      </label>
                      <input
                        type="number"
                        value={snapshotForm.balance}
                        onChange={(e) => setSnapshotForm({ ...snapshotForm, balance: e.target.value })}
                        step="0.01"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelForm}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleCreateSnapshot(account.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Historial de Snapshots</h4>
                <div className="space-y-2">
                  {snapshots
                    .filter(s => s.account_id === account.id)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 5)
                    .map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        {editingSnapshot === snapshot.id ? (
                          <div className="flex-1 flex items-center gap-3">
                            <span className="text-sm text-slate-600">{formatDate(snapshot.date)}</span>
                            <input
                              type="number"
                              value={snapshotForm.balance}
                              onChange={(e) => setSnapshotForm({ ...snapshotForm, balance: e.target.value })}
                              step="0.01"
                              className="w-32 px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleUpdateSnapshot(snapshot.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelForm}
                              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm text-slate-600">{formatDate(snapshot.date)}</p>
                              <p className="text-sm font-semibold text-slate-800">
                                {formatCurrency(snapshot.balance)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditSnapshot(snapshot)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSnapshot(snapshot.id)}
                                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                  {snapshots.filter(s => s.account_id === account.id).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No hay snapshots registrados para esta cuenta
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sortedDates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Resumen por Fecha</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {sortedDates.slice(0, 10).map((date) => {
              const dateSnapshots = groupedSnapshots[date];
              const total = dateSnapshots.reduce((sum, s) => sum + s.balance, 0);

              return (
                <div key={date} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{formatDate(date)}</h3>
                      <p className="text-sm text-slate-600">
                        {dateSnapshots.length} cuenta{dateSnapshots.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Patrimonio Total</p>
                      <p className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dateSnapshots.map((snapshot) => {
                      const account = accounts.find(a => a.id === snapshot.account_id);
                      return (
                        <div key={snapshot.id} className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">{account?.name}</p>
                          <p className="text-lg font-semibold text-slate-800">
                            {formatCurrency(snapshot.balance)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
