import { useState } from 'react';
import { Wallet, Tag, RefreshCw } from 'lucide-react';
import AccountsSettings from './settings/AccountsSettings';
import CategoriesSettings from './settings/CategoriesSettings';
import RecurringSettings from './settings/RecurringSettings';

type Tab = 'accounts' | 'categories' | 'recurring';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');

  const tabs = [
    { id: 'accounts' as Tab, label: 'Cuentas', icon: Wallet },
    { id: 'categories' as Tab, label: 'Categorías', icon: Tag },
    { id: 'recurring' as Tab, label: 'Recurrentes', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ajustes</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'accounts' && <AccountsSettings />}
          {activeTab === 'categories' && <CategoriesSettings />}
          {activeTab === 'recurring' && <RecurringSettings />}
        </div>
      </div>
    </div>
  );
}
