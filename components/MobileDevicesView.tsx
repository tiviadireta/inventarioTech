'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MobileDevice } from '@/types/database';
import { DataTable } from './DataTable';
import { Smartphone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

export function MobileDevicesView() {
  const [data, setData] = useState<MobileDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MobileDevice | null>(null);
  const [formData, setFormData] = useState<Partial<MobileDevice>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mobile_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error('Error fetching mobile devices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item?: MobileDevice) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este celular?')) return;
    try {
      const { error } = await supabase.from('mobile_devices').delete().eq('id', id);
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
          .from('mobile_devices')
          .update(formData)
          .eq('id', editingItem.id)
          .select()
          .single();
        if (error) throw error;
        setData(data.map(d => d.id === editingItem.id ? updated : d));
      } else {
        const { data: inserted, error } = await supabase
          .from('mobile_devices')
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

  return (
    <div className="space-y-8">
      <DataTable
        title="Base de Celulares"
        icon={<Smartphone className="w-5 h-5" />}
        data={data}
        loading={loading}
        searchPlaceholder="Buscar por número, responsável, setor..."
        searchKeys={['number', 'operator', 'sector_user', 'responsible', 'cpf_name', 'type']}
        headerActions={
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-[#F26824] hover:bg-[#d95a1f] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        }
        columns={[
          { header: 'NÚMERO', accessor: 'number' },
          { header: 'OPERADORA', accessor: 'operator' },
          { header: 'SETOR / USUÁRIO', accessor: 'sector_user' },
          { header: 'RESPONSÁVEL', accessor: 'responsible' },
          { header: 'APARELHO / CHIP', accessor: 'chip_device' },
          { header: 'TIPO', accessor: 'type' },
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Celular' : 'Novo Celular'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Número</label>
              <input value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Operadora</label>
              <input value={formData.operator || ''} onChange={e => setFormData({...formData, operator: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Setor / Usuário</label>
              <input value={formData.sector_user || ''} onChange={e => setFormData({...formData, sector_user: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Responsável</label>
              <input value={formData.responsible || ''} onChange={e => setFormData({...formData, responsible: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Aparelho / Chip</label>
              <input value={formData.chip_device || ''} onChange={e => setFormData({...formData, chip_device: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp Business</label>
              <input value={formData.whatsapp_business || ''} onChange={e => setFormData({...formData, whatsapp_business: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Titularidade</label>
              <input value={formData.ownership || ''} onChange={e => setFormData({...formData, ownership: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">CPF / Nome</label>
              <input value={formData.cpf_name || ''} onChange={e => setFormData({...formData, cpf_name: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Plano</label>
              <input value={formData.plan || ''} onChange={e => setFormData({...formData, plan: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Período</label>
              <input value={formData.period || ''} onChange={e => setFormData({...formData, period: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Data</label>
              <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
              <input value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
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
