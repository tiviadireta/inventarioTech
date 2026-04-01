'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AccessCredential } from '@/types/database';
import { DataTable } from './DataTable';
import { Shield, Plus, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { Modal } from './Modal';

const PasswordCell = ({ password }: { password?: string }) => {
  const [copied, setCopied] = useState(false);

  if (!password) return <span className="text-zinc-500">-</span>;

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-400 tracking-widest">
        ••••••••
      </span>
      <button
        onClick={handleCopy}
        className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title="Copiar senha"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

const EmailCell = ({ email }: { email?: string }) => {
  const [copied, setCopied] = useState(false);

  if (!email) return <span className="text-zinc-500">-</span>;

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-zinc-300">{email}</span>
      <button
        onClick={handleCopy}
        className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        title="Copiar email"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

export function AccessCredentialsView() {
  const [data, setData] = useState<AccessCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'plataforma' | 'outlook'>('plataforma');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessCredential | null>(null);
  const [formData, setFormData] = useState<Partial<AccessCredential>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('access_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (err: any) {
      console.error('Error fetching access credentials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item?: AccessCredential) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ type: activeTab === 'outlook' ? 'Outlook' : 'Plataforma' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta credencial?')) return;
    try {
      const { error } = await supabase.from('access_credentials').delete().eq('id', id);
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
          .from('access_credentials')
          .update(formData)
          .eq('id', editingItem.id)
          .select()
          .single();
        if (error) throw error;
        setData(data.map(d => d.id === editingItem.id ? updated : d));
      } else {
        const { data: inserted, error } = await supabase
          .from('access_credentials')
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

  const isOutlook = (d: AccessCredential) => {
    const platform = d.platform_name?.toLowerCase() || '';
    const type = d.type?.toLowerCase() || '';
    return platform.includes('outlook') || type.includes('outlook');
  };

  const filteredData = data.filter(d => 
    activeTab === 'outlook' ? isOutlook(d) : !isOutlook(d)
  );

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab('plataforma')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plataforma' ? 'bg-[#F26824] text-white' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'}`}
        >
          Plataformas
        </button>
        <button 
          onClick={() => setActiveTab('outlook')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'outlook' ? 'bg-[#F26824] text-white' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'}`}
        >
          Outlook
        </button>
      </div>

      <DataTable
        title={activeTab === 'plataforma' ? 'Base de Plataformas' : 'Base de Outlook'}
        icon={<Shield className="w-5 h-5" />}
        data={filteredData}
        loading={loading}
        searchPlaceholder="Buscar por plataforma, email, tipo..."
        searchKeys={['platform_name', 'email', 'type', 'observations']}
        headerActions={
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-[#F26824] hover:bg-[#d95a1f] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        }
        columns={[
          { header: activeTab === 'plataforma' ? 'PLATAFORMA' : 'SERVIÇO', accessor: 'platform_name' },
          { 
            header: 'EMAIL / USUÁRIO', 
            accessor: (item) => <EmailCell email={item.email || undefined} /> 
          },
          { header: 'TIPO', accessor: 'type' },
          { 
            header: 'SENHA', 
            accessor: (item) => <PasswordCell password={item.password || undefined} />
          },
          { header: 'OBSERVAÇÕES', accessor: 'observations' },
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Credencial' : 'Nova Credencial'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">{activeTab === 'plataforma' ? 'Plataforma' : 'Serviço'} *</label>
              <input required value={formData.platform_name || ''} onChange={e => setFormData({...formData, platform_name: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email / Usuário</label>
              <input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
              <input value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo</label>
              <input value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Observações</label>
              <textarea value={formData.observations || ''} onChange={e => setFormData({...formData, observations: e.target.value})} className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F26824]" rows={3} />
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
