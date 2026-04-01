'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AccessCredentialsView } from '@/components/AccessCredentialsView';
import { InventoryView } from '@/components/InventoryView';
import { MobileDevicesView } from '@/components/MobileDevicesView';

type ViewType = 'inventory' | 'mobile' | 'credentials';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('inventory');

  const navigation = [
    { id: 'inventory', name: 'Equipamentos' },
    { id: 'mobile', name: 'Controle Celulares' },
    { id: 'credentials', name: 'Acessos & Senhas' },
  ] as const;

  const renderContent = () => {
    switch (activeView) {
      case 'credentials':
        return <AccessCredentialsView />;
      case 'inventory':
        return <InventoryView />;
      case 'mobile':
        return <MobileDevicesView />;
      default:
        return <InventoryView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Inventário <span className="text-[#F26824]">VD</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gerenciamento de Ativos da empresa</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-zinc-800 mb-8 overflow-x-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`pb-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeView === item.id ? 'text-[#F26824]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {item.name}
              {activeView === item.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F26824]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
}
