import { useState } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { exportMovementsToCSV, downloadCSV, parseCSV, validateAndImportMovements } from '../services/importExport';

interface ImportExportModalProps {
  mode: 'import' | 'export' | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExportModal({ mode, onClose, onSuccess }: ImportExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  async function handleExport() {
    try {
      setLoading(true);
      const csv = await exportMovementsToCSV();
      const filename = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar los movimientos');
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!fileContent) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setImporting(true);
      const movements = await parseCSV(fileContent);
      const importResult = await validateAndImportMovements(movements);
      setResult(importResult);

      if (importResult.success > 0) {
        onSuccess();
      }
    } catch (error: any) {
      alert('Error al importar: ' + error.message);
    } finally {
      setImporting(false);
    }
  }

  if (!mode) return null;

  if (mode === 'export') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="bg-blue-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold">Exportar Movimientos</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Formato del archivo CSV</p>
                <p>El archivo incluirá todos tus movimientos con las siguientes columnas:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Fecha</li>
                  <li>Tipo</li>
                  <li>Importe</li>
                  <li>Cuenta</li>
                  <li>Categoría</li>
                  <li>Fijo/Variable</li>
                  <li>Nota</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-600 text-white p-6 flex items-center justify-between rounded-t-2xl sticky top-0">
          <h2 className="text-xl font-bold">Importar Movimientos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Formato esperado del CSV</p>
              <p className="mb-2">El archivo debe tener las siguientes columnas (con encabezados):</p>
              <code className="block bg-white p-2 rounded text-xs">
                Fecha,Tipo,Importe,Cuenta,Categoría,Fijo/Variable,Nota
              </code>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Fecha: formato DD/MM/AAAA</li>
                <li>Tipo: "Ingreso" o "Gasto"</li>
                <li>Importe: número positivo</li>
                <li>Cuenta y Categoría: deben existir previamente</li>
                <li>Las transferencias se omiten en la importación</li>
              </ul>
            </div>
          </div>

          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleccionar archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {fileContent && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Archivo cargado. Presiona "Importar" para continuar.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!fileContent || importing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                {result.success > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">
                        {result.success} movimiento{result.success !== 1 ? 's' : ''} importado{result.success !== 1 ? 's' : ''} correctamente
                      </p>
                    </div>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-2">
                          {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-700 bg-white p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
