import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, Trash2, Box, Search, DollarSign, Edit, Save, X } from 'lucide-react';
import { db } from '../firebaseConfig'; 
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto transition-colors duration-200">
      
      {/* Cabeçalho e Métricas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Estoque Geral</h1>
          <p className="text-[#8F9BB3]">Cadastre e gerencie os materiais disponíveis no galpão.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-6 py-3 flex items-center gap-4 shadow-lg">
            <div className="bg-[#FFCA18]/10 p-2 rounded-lg text-[#FFCA18]">
              <Box size={24} />
            </div>
            <div>
              <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Total de Itens</p>
              <p className="text-xl font-bold text-white">{totalItens}</p>
            </div>
          </div>
          
          <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-6 py-3 flex items-center gap-4 shadow-lg">
            <div className="bg-green-500/10 p-2 rounded-lg text-green-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Valor Imobilizado</p>
              <p className="text-xl font-bold text-white">
                R$ {Number(valorTotalEstoque).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl mb-8">
        <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-3 mb-5 text-[#FFCA18] flex items-center gap-2">
          <PlusCircle size={20} /> Cadastrar Novo Material no Estoque
        </h2>
        
        <form onSubmit={handleAddMaterial} className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Nome do Material</label>
            <input 
              type="text" 
              name="nome" 
              value={novoMaterial.nome} 
              onChange={handleInputChange} 
              required 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="flex-1 w-full">
            <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Fornecedor (Opcional)</label>
            <input 
              type="text" 
              name="fornecedor" 
              value={novoMaterial.fornecedor} 
              onChange={handleInputChange} 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="w-full lg:w-32">
            <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Qtd.</label>
            <input 
              type="number" 
              name="quantidade" 
              value={novoMaterial.quantidade} 
              onChange={handleInputChange} 
              required 
              min="1" 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <div className="w-full lg:w-40">
            <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">V. Unit. (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              name="valorUnitario" 
              value={novoMaterial.valorUnitario} 
              onChange={handleInputChange} 
              required 
              min="0" 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full lg:w-auto px-8 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 h-[50px]"
          >
            {isSubmitting ? 'A salvar...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Tabela de Materiais */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2F55] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Package className="text-[#FFCA18]" size={24} />
            <h2 className="text-lg font-bold text-white">Materiais Guardados</h2>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar material..." 
              value={termoBusca} 
              onChange={(e) => setTermoBusca(e.target.value)} 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-[#8F9BB3]">A carregar estoque...</div>
        ) : materiaisFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[#1B1F3B] text-[#8F9BB3]">
                <tr>
                  <th className="px-6 py-4 font-bold w-1/3">Material</th>
                  <th className="px-6 py-4 font-bold w-1/4">Fornecedor</th>
                  <th className="px-6 py-4 font-bold text-center w-24">Qtd.</th>
                  <th className="px-6 py-4 font-bold w-32">V. Unitário</th>
                  <th className="px-6 py-4 font-bold w-32">Valor Total</th>
                  <th className="px-6 py-4 font-bold text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F55]">
                {materiaisFiltrados.map((item) => {
                  const qtdNum = Number(item.quantidade) || 0;
                  const vUnitNum = Number(item.valorUnitario) || 0;
                  const vTotalNum = Number(item.valorTotal) || (qtdNum * vUnitNum);

                  return (
                    <tr key={item.id} className="hover:bg-[#1B1F3B] transition-colors">
                      {editingId === item.id ? (
                        <>
                          <td className="p-2"><input type="text" name="nome" value={editFormData.nome} onChange={handleEditChange} className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-sm" /></td>
                          <td className="p-2"><input type="text" name="fornecedor" value={editFormData.fornecedor} onChange={handleEditChange} className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-sm" /></td>
                          <td className="p-2"><input type="number" name="quantidade" min="0" value={editFormData.quantidade} onChange={handleEditChange} className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-center text-sm" /></td>
                          <td className="p-2"><input type="number" name="valorUnitario" step="0.01" min="0" value={editFormData.valorUnitario} onChange={handleEditChange} className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-sm" /></td>
                          <td className="px-6 py-4 font-bold text-green-400">R$ {( (Number(editFormData.quantidade) || 0) * (Number(editFormData.valorUnitario) || 0) ).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleSaveEdit(item.id)} className="text-green-400 hover:bg-green-400/10 p-2 rounded-lg"><Save size={18} /></button>
                              <button onClick={handleCancelEdit} className="text-[#8F9BB3] hover:text-white p-2 rounded-lg"><X size={18} /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-medium text-white">{item.nome}</td>
                          <td className="px-6 py-4 text-[#8F9BB3]">{item.fornecedor}</td>
                          <td className="px-6 py-4 text-center font-bold text-white"><span className="bg-[#1B1F3B] px-3 py-1 rounded-lg border border-[#2A2F55]">{qtdNum}</span></td>
                          <td className="px-6 py-4 text-[#8F9BB3]">R$ {vUnitNum.toFixed(2)}</td>
                          <td className="px-6 py-4 font-bold text-green-400">R$ {vTotalNum.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => handleEditClick(item)} className="text-[#FFCA18] hover:bg-[#FFCA18]/10 p-2 rounded-lg"><Edit size={18} /></button>
                              <button onClick={() => handleDeleteMaterial(item.id, item.nome)} className="text-[#4A5578] hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-[#8F9BB3]">{termoBusca ? 'Nenhum material encontrado.' : 'Estoque vazio.'}</div>
        )}
      </div>
    </div>
  );
}