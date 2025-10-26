import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { checkNeedsSeeding, seedUserData } from '../services/seed';

export default function SeedDataBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfNeedsSeeding();
  }, []);

  async function checkIfNeedsSeeding() {
    try {
      const needs = await checkNeedsSeeding();
      setShow(needs);
    } catch (error) {
      console.error('Error verificando datos:', error);
    }
  }

  async function handleSeed() {
    try {
      setLoading(true);
      await seedUserData();
      setShow(false);
      window.location.reload();
    } catch (error) {
      console.error('Error inicializando datos:', error);
      alert('Error al inicializar datos de ejemplo');
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-4">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 mb-1">
            ¡Bienvenido a tu gestor de finanzas personales!
          </p>
          <p className="text-sm text-blue-700 mb-3">
            Tu cuenta está vacía. ¿Quieres que creemos algunas cuentas y categorías de ejemplo para empezar?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear datos de ejemplo'}
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-colors"
            >
              No, empezaré desde cero
            </button>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5 text-blue-600" />
        </button>
      </div>
    </div>
  );
}
