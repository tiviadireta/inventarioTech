'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/types/database';
import { DataTable } from './DataTable';
import { Database, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function InventoryView() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ status: 'Disponível' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      setData(data.filter(d => d.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const { data: updated, error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', editingItem.id)
          .select()
          .single();
        if (error) throw error;
        setData(data.map(d => d.id === editingItem.id ? updated : d));
      } else {
        const { data: inserted, error } = await supabase
          .from('inventory')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        setData([inserted, ...data]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400">
        <h3 className="font-semibold">Erro ao carregar dados</h3>
        <p>{error}</p>
      </div>
    );
  }

  const total = data.length;
  const emOperacao = data.filter(d => d.status?.toLowerCase() === 'em uso').length;
  const disponivel = data.filter(d => d.status?.toLowerCase() === 'disponível' || d.status?.toLowerCase() === 'disponivel').length;
  const manutencao = data.filter(d => d.status?.toLowerCase() === 'manutenção' || d.status?.toLowerCase() === 'manutencao').length;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] border border-[#F26824] rounded-xl p-6 flex flex-col justify-center shadow-[0_0_15px_rgba(242,104,36,0.05)]">
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Total de Ativos</span>
          <span className="text-4xl font-bold text-white">{total}</span>
        </div>
        <div className="bg-[#18181b] border border-green-500/30 rounded-xl p-6 flex flex-col justify-center">
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Em Operação</span>
          <span className="text-4xl font-bold text-green-500">{emOperacao}</span>
        </div>
        <div className="bg-[#18181b] border border-blue-500/30 rounded-xl p-6 flex flex-col justify-center">
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Disponível</span>
          <span className="text-4xl font-bold text-blue-500">{disponivel}</span>
        </div>
        <div className="bg-[#18181b] border border-[#F26824]/30 rounded-xl p-6 flex flex-col justify-center">
          <span className="text-zinc-500 text-xs font-bold tracking-wider uppercase mb-2">Manutenção</span>
          <span className="text-4xl font-bold text-[#F26824]">{manutencao}</span>
        </div>
      </div>
      
      <DataTable
        title="Base de Equipamentos"
        icon={<Database className="w-5 h-5" />}
        data={data}
        loading={loading}
        searchPlaceholder="Buscar por serial, nome, status, local..."
        searchKeys={['equipment', 'brand_model', 'serial_number', 'user', 'location', 'status']}
        headerActions={
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-[#F26824] hover:bg-[#d95a1f] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        }
        columns={[
          { header: 'EQUIPAMENTO', accessor: 'equipment' },
          { header: 'MARCA / MODELO', accessor: 'brand_model' },
          { header: 'SÉRIE (ID)', accessor: 'serial_number' },
          { header: 'RESPONSÁVEL', accessor: (item) => item.user || '-' },
          { 
            header: 'LOCAL / STATUS', 
            accessor: (item) => (
              <div className="flex flex-col gap-1">
                <span className="text-zinc-300">{item.location || '-'}</span>
                <span className={`text-xs font-medium ${
                  item.status?.toLowerCase() === 'disponível' || item.status?.toLowerCase() === 'disponivel'
                    ? 'text-blue-400'
                    : item.status?.toLowerCase() === 'em uso'
                    ? 'text-green-400'
                    : item.status?.toLowerCase() === 'manutenção' || item.status?.toLowerCase() === 'manutencao'
                    ? 'text-[#F26824]'
                    : 'text-zinc-500'
                }`}>
                  {item.status || '-'}
                </span>
              </div>
            ) 
          },
          { 
            header: 'AÇÕES', 
            accessor: (item) => (
              <div className="flex gap-3">
                <button onClick={() => handleOpenModal(item)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) 
          },
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Equipamento *</label>
              <input required value={formData.equipment || ''} onChange={e => setFormData({...formData, equipment: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Marca / Modelo *</label>
              <input required value={formData.brand_model || ''} onChange={e => setFormData({...formData, brand_model: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nº Série *</label>
              <input required value={formData.serial_number || ''} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
              <select value={formData.status || 'Disponível'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]">
                <option value="Disponível">Disponível</option>
                <option value="Em uso">Em uso</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Usuário / Responsável</label>
              <input value={formData.user || ''} onChange={e => setFormData({...formData, user: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Localização</label>
              <input value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Data de Aquisição</label>
              <input type="date" value={formData.acquisition_date || ''} onChange={e => setFormData({...formData, acquisition_date: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Garantia Até</label>
              <input type="date" value={formData.warranty_until || ''} onChange={e => setFormData({...formData, warranty_until: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Conta Microsoft</label>
              <input value={formData.microsoft_account || ''} onChange={e => setFormData({...formData, microsoft_account: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Configuração</label>
              <textarea value={formData.configuration || ''} onChange={e => setFormData({...formData, configuration: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Observações</label>
              <textarea value={formData.observations || ''} onChange={e => setFormData({...formData, observations: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-[#F26824] hover:bg-[#d95a1f] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
