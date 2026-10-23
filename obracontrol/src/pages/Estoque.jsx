import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, Trash2, Box, Search, DollarSign, Edit, Save, X } from 'lucide-react';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Estoque() {
  const { currentUser, userData } = useAuth();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');

  const [novoMaterial, setNovoMaterial] = useState({ 
    nome: '', 
    fornecedor: '', 
    quantidade: '', 
    valorUnitario: '' 
  });
  
  const [editingId, setEditingId] = useState(null); 
  const [editFormData, setEditFormData] = useState({ 
    nome: '', 
    fornecedor: '', 
    quantidade: '', 
    valorUnitario: '' 
  });

  // Escuta em tempo real (onSnapshot) para atualizar o estoque automaticamente
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'estoque'), (querySnapshot) => {
      const estoqueArray = [];
      querySnapshot.forEach((docSnap) => {
        estoqueArray.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMateriais(estoqueArray);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar o estoque em tempo real:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setNovoMaterial({ ...novoMaterial, [e.target.name]: e.target.value });
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!novoMaterial.nome || !novoMaterial.quantidade || !novoMaterial.valorUnitario) return;

    setIsSubmitting(true);
    try {
      const qtd = Number(novoMaterial.quantidade) || 0;
      const vUnit = Number(novoMaterial.valorUnitario) || 0;

      const materialParaSalvar = {
        nome: novoMaterial.nome,
        fornecedor: novoMaterial.fornecedor || 'Não informado',
        quantidade: qtd,
        valorUnitario: vUnit,
        valorTotal: qtd * vUnit,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'estoque'), materialParaSalvar);
      
      await addDoc(collection(db, 'movimentacoes'), {
        tipo: 'ENTRADA',
        modulo: 'Estoque Geral',
        descricao: `Cadastrou ${materialParaSalvar.quantidade} un. de ${materialParaSalvar.nome}`,
        usuario: userData?.usuario || currentUser?.email || 'Utilizador',
        data: serverTimestamp()
      });

      setNovoMaterial({ nome: '', fornecedor: '', quantidade: '', valorUnitario: '' });
    } catch (error) {
      console.error("Erro ao cadastrar material:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id, nome) => {
    if (window.confirm(`Tem a certeza que deseja excluir "${nome}" do estoque?`)) {
      try {
        await deleteDoc(doc(db, 'estoque', id));

        await addDoc(collection(db, 'movimentacoes'), {
          tipo: 'EXCLUSAO',
          modulo: 'Estoque Geral',
          descricao: `Excluiu o material ${nome} do estoque`,
          usuario: userData?.usuario || currentUser?.email || 'Utilizador',
          data: serverTimestamp()
        });
      } catch (error) {
        console.error("Erro ao excluir material:", error);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditFormData({ 
      nome: item.nome || '', 
      fornecedor: item.fornecedor || '', 
      quantidade: item.quantidade ?? '', 
      valorUnitario: item.valorUnitario ?? '' 
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      const docRef = doc(db, 'estoque', id);
      const qtd = Number(editFormData.quantidade) || 0;
      const vUnit = Number(editFormData.valorUnitario) || 0;
      const dadosAtualizados = {
        nome: editFormData.nome,
        fornecedor: editFormData.fornecedor || 'Não informado',
        quantidade: qtd,
        valorUnitario: vUnit,
        valorTotal: qtd * vUnit
      };

      await updateDoc(docRef, dadosAtualizados);
      setEditingId(null);

      await addDoc(collection(db, 'movimentacoes'), {
        tipo: 'EDICAO',
        modulo: 'Estoque Geral',
        descricao: `Editou as informações do material: ${dadosAtualizados.nome}`,
        usuario: userData?.usuario || currentUser?.email || 'Utilizador',
        data: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao atualizar material:", error);
    }
  };

  const materiaisFiltrados = materiais.filter(item => 
    (item.nome || '').toLowerCase().includes(termoBusca.toLowerCase()) || 
    (item.fornecedor || '').toLowerCase().includes(termoBusca.toLowerCase())
  );
  
  // Cálculos dinâmicos baseados no estado reativo do Firestore
  const totalItens = materiais.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);

  const valorTotalEstoque = materiais.reduce((acc, item) => {
    const q = Number(item.quantidade) || 0;
    const v = Number(item.valorUnitario) || 0;
    const t = Number(item.valorTotal) || (q * v);
    return acc + (isNaN(t) ? 0 : t);
  }, 0);

  const inputEdicao = 'w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-sm min-h-[44px] md:min-h-0';
  const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const colunasEstoque = [
    {
      key: 'nome',
      header: 'Material',
      primary: true,
      textClassName: 'font-medium text-white',
      render: (item) => editingId === item.id
        ? <input type="text" name="nome" value={editFormData.nome} onChange={handleEditChange} className={inputEdicao} />
        : item.nome
    },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      textClassName: 'text-[#8F9BB3]',
      render: (item) => editingId === item.id
        ? <input type="text" name="fornecedor" value={editFormData.fornecedor} onChange={handleEditChange} className={inputEdicao} />
        : item.fornecedor
    },
    {
      key: 'quantidade',
      header: 'Qtd.',
      align: 'center',
      textClassName: 'font-bold text-white',
      render: (item) => editingId === item.id
        ? <input type="number" name="quantidade" min="0" value={editFormData.quantidade} onChange={handleEditChange} className={`${inputEdicao} text-center`} />
        : <span className="inline-block bg-[#1B1F3B] px-3 py-1 rounded-lg border border-[#2A2F55]">{Number(item.quantidade) || 0}</span>
    },
    {
      key: 'valorUnitario',
      header: 'V. Unitário',
      textClassName: 'text-[#8F9BB3]',
      render: (item) => editingId === item.id
        ? <input type="number" name="valorUnitario" step="0.01" min="0" value={editFormData.valorUnitario} onChange={handleEditChange} className={inputEdicao} />
        : `R$ ${(Number(item.valorUnitario) || 0).toFixed(2)}`
    },
    {
      key: 'valorTotal',
      header: 'Valor Total',
      textClassName: 'font-bold text-green-400',
      render: (item) => {
        if (editingId === item.id) {
          return `R$ ${formatarMoeda((Number(editFormData.quantidade) || 0) * (Number(editFormData.valorUnitario) || 0))}`;
        }
        const q = Number(item.quantidade) || 0;
        const v = Number(item.valorUnitario) || 0;
        return `R$ ${formatarMoeda(Number(item.valorTotal) || (q * v))}`;
      }
    }
  ];

  const acoesEstoque = (item) => editingId === item.id
    ? [
        { label: 'Salvar', icon: Save, variant: 'success', iconOnly: true, onClick: () => handleSaveEdit(item.id) },
        { label: 'Cancelar', icon: X, variant: 'neutral', iconOnly: true, onClick: handleCancelEdit }
      ]
    : [
        { label: 'Editar', icon: Edit, variant: 'primary', iconOnly: true, onClick: () => handleEditClick(item) },
        { label: 'Excluir', icon: Trash2, variant: 'danger', iconOnly: true, onClick: () => handleDeleteMaterial(item.id, item.nome) }
      ];

  return (
    <div className="flex-1 bg-[#0B0E26] p-4 sm:p-6 md:p-8 text-white transition-colors duration-200 min-w-0">
      
      {/* Cabeçalho e Métricas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Estoque Geral</h1>
          <p className="text-sm sm:text-base text-[#8F9BB3]">Cadastre e gerencie os materiais disponíveis no galpão.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 sm:gap-4 w-full md:w-auto">
          <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 shadow-lg flex-1 sm:flex-initial">
            <div className="bg-[#FFCA18]/10 p-2 rounded-lg text-[#FFCA18] shrink-0">
              <Box size={22} />
            </div>
            <div>
              <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Total de Itens</p>
              <p className="text-lg sm:text-xl font-bold text-white">{totalItens}</p>
            </div>
          </div>
          
          <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 shadow-lg flex-1 sm:flex-initial">
            <div className="bg-green-500/10 p-2 rounded-lg text-green-400 shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Valor Imobilizado</p>
              <p className="text-lg sm:text-xl font-bold text-white">
                R$ {Number(valorTotalEstoque).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-4 sm:p-6 shadow-xl mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-bold border-b border-[#2A2F55] pb-3 mb-5 text-[#FFCA18] flex items-center gap-2">
          <PlusCircle size={20} /> Cadastrar Novo Material no Estoque
        </h2>
        
        <form onSubmit={handleAddMaterial} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">Nome do Material</label>
            <input 
              type="text" 
              name="nome" 
              value={novoMaterial.nome} 
              onChange={handleInputChange} 
              required 
              placeholder="Ex: Cimento CP-II"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">Fornecedor (Opcional)</label>
            <input 
              type="text" 
              name="fornecedor" 
              value={novoMaterial.fornecedor} 
              onChange={handleInputChange} 
              placeholder="Ex: Votorantim"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">Qtd.</label>
            <input 
              type="number" 
              name="quantidade" 
              value={novoMaterial.quantidade} 
              onChange={handleInputChange} 
              required 
              min="1" 
              placeholder="0"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">V. Unit. (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              name="valorUnitario" 
              value={novoMaterial.valorUnitario} 
              onChange={handleInputChange} 
              required 
              min="0" 
              placeholder="0,00"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full px-4 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 h-[48px] shadow-lg cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Materiais */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#2A2F55] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Package className="text-[#FFCA18]" size={22} />
            <h2 className="text-base sm:text-lg font-bold text-white">Materiais Guardados</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar material..." 
              value={termoBusca} 
              onChange={(e) => setTermoBusca(e.target.value)} 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
        </div>
        
        <ResponsiveTable
          columns={colunasEstoque}
          data={materiaisFiltrados}
          actions={acoesEstoque}
          actionsAlign="center"
          loading={loading}
          loadingMessage="A carregar estoque..."
          emptyMessage={termoBusca ? 'Nenhum material encontrado.' : 'Estoque vazio.'}
        />
      </div>
    </div>
  );
}