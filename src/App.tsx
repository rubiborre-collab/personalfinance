import { useState, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QuickMovementModal from './components/QuickMovementModal';
import TransferModal from './components/TransferModal';
import ImportExportModal from './components/ImportExportModal';
import SeedDataBanner from './components/SeedDataBanner';

const NetWorth = lazy(() => import('./components/NetWorth'));
const Movements = lazy(() => import('./components/Movements'));
const Calendar = lazy(() => import('./components/Calendar'));
const Diary = lazy(() => import('./components/Diary'));
const Settings = lazy(() => import('./components/Settings'));

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [quickActionType, setQuickActionType] = useState<'income' | 'expense' | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleQuickAction = (type: 'income' | 'expense') => {
    setQuickActionType(type);
  };

  const handleModalClose = () => {
    setQuickActionType(null);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAddMovement = () => {
    setQuickActionType('expense');
  };

  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-slate-600">Cargando...</div>
    </div>
  );

  return (
    <>
      <SeedDataBanner />
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onQuickAction={handleQuickAction}
      >
        {currentPage === 'dashboard' && <Dashboard key={`dashboard-${refreshKey}`} />}
        <Suspense fallback={<LoadingFallback />}>
          {currentPage === 'patrimonio' && <NetWorth key={`networth-${refreshKey}`} />}
          {currentPage === 'movimientos' && (
            <Movements
              key={`movements-${refreshKey}`}
              onExport={() => setImportExportMode('export')}
              onImport={() => setImportExportMode('import')}
            />
          )}
          {currentPage === 'calendario' && <Calendar key={`calendar-${refreshKey}`} onAddMovement={handleAddMovement} />}
          {currentPage === 'diario' && <Diary key={`diary-${refreshKey}`} />}
          {currentPage === 'ajustes' && <Settings key={`settings-${refreshKey}`} />}
        </Suspense>
      </Layout>

      {quickActionType && (
        <QuickMovementModal
          type={quickActionType}
          isOpen={!!quickActionType}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleModalSuccess}
      />

      <ImportExportModal
        mode={importExportMode}
        onClose={() => setImportExportMode(null)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

export default App;
