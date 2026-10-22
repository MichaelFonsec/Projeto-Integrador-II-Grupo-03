import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, ArrowLeft, MapPin, DollarSign, CheckCircle, Calendar, 
  Package, FileText, Edit, Trash2, Save, X, AlertCircle, Plus 
} from 'lucide-react';

export default function Obra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [obra, setObra] = useState(null);
  const [estoqueGeral, setEstoqueGeral] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    nome: '',
    local: '',
    orcamentoTotal: '',
    status: 'Em Andamento',
    data: '',
    materiais_utilizados: []
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    carregarDadosIniciais();
  }, [id]);

  const carregarDadosIniciais = async () => {
    setLoading(true);
    try {
      // 1. Busca os dados da obra
      const docRef = doc(db, 'obras', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dados = docSnap.data();
        setObra({ id: docSnap.id, ...dados });
        setEditFormData({
          nome: dados.nome || '',
          local: dados.local || '',
          orcamentoTotal: dados.orcamentoTotal || '',
          status: dados.status || 'Em Andamento',
          data: dados.data || '',
          materiais_utilizados: dados.materiais_utilizados || []
        });
      }

      // 2. Busca os itens disponíveis no Estoque Geral para vincular na obra
      const estoqueSnapshot = await getDocs(collection(db, 'estoque'));
      const itensEstoque = [];
      estoqueSnapshot.forEach((docSnap) => {
        itensEstoque.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEstoqueGeral(itensEstoque);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Quando o usuário seleciona um item do estoque na lista
  const handleSelectEstoqueItem = (index, estoqueId) => {
    const itemSelecionado = estoqueGeral.find(item => item.id === estoqueId);
    const novosMateriais = [...editFormData.materiais_utilizados];

    if (itemSelecionado) {
      const qtd = Number(novosMateriais[index].quantidade) || 1;
      const vUnit = Number(itemSelecionado.valorUnitario) || 0;

      novosMateriais[index] = {
        estoqueId: itemSelecionado.id,
        nome: itemSelecionado.nome || '',
        fornecedor: itemSelecionado.fornecedor || 'Não informado',
        quantidade: qtd,
        valorUnitario: vUnit,
        valorTotal: qtd * vUnit
      };
    } else {
      novosMateriais[index] = { estoqueId: '', nome: '', fornecedor: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 };
    }

    setEditFormData({ ...editFormData, materiais_utilizados: novosMateriais });
  };

  const handleMaterialFieldChange = (index, field, value) => {
    const novosMateriais = [...editFormData.materiais_utilizados];
    novosMateriais[index][field] = value;

    if (field === 'quantidade' || field === 'valorUnitario') {
      const qtd = Number(novosMateriais[index].quantidade) || 0;
      const vUnit = Number(novosMateriais[index].valorUnitario) || 0;
      novosMateriais[index].valorTotal = qtd * vUnit;
    }

    setEditFormData({ ...editFormData, materiais_utilizados: novosMateriais });
  };

  const handleAddMaterial = () => {
    setEditFormData({
      ...editFormData,
      materiais_utilizados: [
        ...editFormData.materiais_utilizados,
        { estoqueId: '', nome: '', fornecedor: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }
      ]
    });
  };

  const handleRemoveMaterial = (index) => {
    const novosMateriais = editFormData.materiais_utilizados.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, materiais_utilizados: novosMateriais });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'obras', id);
      const dadosAtualizados = {
        nome: editFormData.nome,
        local: editFormData.local,
        orcamentoTotal: Number(editFormData.orcamentoTotal) || 0,
        status: editFormData.status,
        data: editFormData.data,
        materiais_utilizados: editFormData.materiais_utilizados,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, dadosAtualizados);
      setObra(prev => ({ ...prev, ...dadosAtualizados }));
      setIsEditing(false);

      await addDoc(collection(db, 'movimentacoes'), {
        tipo: 'EDICAO',
        modulo: 'Obras',
        descricao: `Atualizou os dados e materiais da obra: ${editFormData.nome}`,
        usuario: userData?.usuario || currentUser?.email || 'Usuário',
        data: serverTimestamp()
      });

      alert("Obra e materiais atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar obra:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObra = async () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente a obra "${obra?.nome}"?`)) {
      try {
        await deleteDoc(doc(db, 'obras', id));
        
        await addDoc(collection(db, 'movimentacoes'), {
          tipo: 'EXCLUSAO',
          modulo: 'Obras',
          descricao: `Excluiu a obra: ${obra?.nome}`,
          usuario: userData?.usuario || currentUser?.email || 'Usuário',
          data: serverTimestamp()
        });

        navigate('/');
      } catch (error) {
        console.error("Erro ao excluir obra:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white flex items-center justify-center">
        <p className="text-[#8F9BB3]">A carregar dados do projeto...</p>
      </div>
    );
  }

  if (!id || !obra) {
    return (
      <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-[#FFCA18]" />
        <p className="text-[#8F9BB3] text-lg">Obra não encontrada ou ID inválido.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#FFCA18] text-[#0B0E26] rounded-xl font-bold hover:bg-[#e6b616] transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Voltar para o Painel
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto transition-colors duration-200">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-[#111535] border border-[#2A2F55] rounded-xl text-[#8F9BB3] hover:text-white hover:border-[#FFCA18] transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{obra.nome}</h1>
            <p className="text-[#8F9BB3]">Informações detalhadas sincronizadas com o Firestore.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-[#111535] border border-[#2A2F55] hover:border-[#FFCA18] text-[#FFCA18] rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                <Edit size={18} /> Editar Obra
              </button>
              <button 
                onClick={handleDeleteObra}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold flex items-center gap-2 transition-colors"
              >
                <Trash2 size={18} /> Excluir
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-[#111535] border border-[#2A2F55] text-[#8F9BB3] hover:text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <X size={18} /> Cancelar Edição
            </button>
          )}
        </div>
      </div>

      {/* Modo de Edição ou Visualização */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-6">
          <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-3 mb-5 text-[#FFCA18] flex items-center gap-2">
              <Edit size={20} /> Editar Informações Gerais da Obra
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Nome da Obra</label>
                <input 
                  type="text" 
                  name="nome" 
                  value={editFormData.nome} 
                  onChange={handleEditChange} 
                  required 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Localização / Endereço</label>
                <input 
                  type="text" 
                  name="local" 
                  value={editFormData.local} 
                  onChange={handleEditChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Orçamento Total (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="orcamentoTotal" 
                  value={editFormData.orcamentoTotal} 
                  onChange={handleEditChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Status</label>
                <select 
                  name="status" 
                  value={editFormData.status} 
                  onChange={handleEditChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none"
                >
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Planeamento">Planeamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Suspensa">Suspensa</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Data de Início</label>
                <input 
                  type="date" 
                  name="data" 
                  value={editFormData.data} 
                  onChange={handleEditChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Seção de Edição de Materiais vinculados ao Estoque */}
          <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#2A2F55] pb-3 mb-5">
              <h2 className="text-lg font-bold text-[#FFCA18] flex items-center gap-2">
                <Package size={20} /> Materiais Utilizados (Vindos do Estoque)
              </h2>
              <button 
                type="button" 
                onClick={handleAddMaterial}
                className="px-4 py-2 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold text-sm flex items-center gap-1 transition-colors"
              >
                <Plus size={16} /> Adicionar Material do Estoque
              </button>
            </div>

            {editFormData.materiais_utilizados.length > 0 ? (
              <div className="space-y-4">
                {editFormData.materiais_utilizados.map((mat, index) => (
                  <div key={index} className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end">
                    
                    {/* Selecionar item direto do Estoque */}
                    <div className="flex-1 w-full">
                      <label className="text-xs text-[#8F9BB3] mb-1 block">Selecionar do Estoque Geral</label>
                      <select
                        value={mat.estoqueId || ''}
                        onChange={(e) => handleSelectEstoqueItem(index, e.target.value)}
                        className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-sm text-white focus:border-[#FFCA18] outline-none"
                      >
                        <option value="">Selecione um material...</option>
                        {estoqueGeral.map((itemEstoque) => (
                          <option key={itemEstoque.id} value={itemEstoque.id}>
                            {itemEstoque.nome} (Disp: {itemEstoque.quantidade} | R$ {Number(itemEstoque.valorUnitario || 0).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 w-full">
                      <label className="text-xs text-[#8F9BB3] mb-1 block">Fornecedor</label>
                      <input 
                        type="text" 
                        value={mat.fornecedor || ''} 
                        readOnly
                        className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-sm text-[#8F9BB3] outline-none cursor-not-allowed" 
                      />
                    </div>

                    <div className="w-full md:w-28">
                      <label className="text-xs text-[#8F9BB3] mb-1 block">Qtd. Usada</label>
                      <input 
                        type="number" 
                        min="1"
                        value={mat.quantidade || ''} 
                        onChange={(e) => handleMaterialFieldChange(index, 'quantidade', e.target.value)}
                        required
                        className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-sm text-white text-center focus:border-[#FFCA18] outline-none" 
                      />
                    </div>

                    <div className="w-full md:w-36">
                      <label className="text-xs text-[#8F9BB3] mb-1 block">V. Unitário (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={mat.valorUnitario || ''} 
                        readOnly
                        className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-sm text-[#8F9BB3] outline-none cursor-not-allowed" 
                      />
                    </div>

                    <div className="w-full md:w-36">
                      <label className="text-xs text-[#8F9BB3] mb-1 block">Total (R$)</label>
                      <div className="px-3 py-2 text-sm font-bold text-green-400 bg-[#0B0E26] border border-[#2A2F55] rounded-lg">
                        R$ {Number(mat.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveMaterial(index)}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                      title="Remover material"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8F9BB3] text-center py-6">Nenhum material vinculado a esta obra. Clique no botão acima para selecionar do estoque.</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} /> {isSubmitting ? 'A salvar...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#FFCA18]/10 p-2 rounded-lg text-[#FFCA18]">
                  <MapPin size={20} />
                </div>
                <span className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Localização</span>
              </div>
              <p className="text-lg font-bold text-white">{obra.local || 'Não especificado'}</p>
            </div>

            <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500/10 p-2 rounded-lg text-green-400">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Orçamento Total</span>
              </div>
              <p className="text-lg font-bold text-white">
                {obra.orcamentoTotal ? `R$ ${Number(obra.orcamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
              </p>
            </div>

            <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                  <CheckCircle size={20} />
                </div>
                <span className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Status Atual</span>
              </div>
              <p className="text-lg font-bold text-white">{obra.status || 'Em Andamento'}</p>
            </div>

          </div>

          {/* Detalhes de Data */}
          <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-3 mb-5 text-[#FFCA18] flex items-center gap-2">
              <Building2 size={20} /> Informações do Projeto
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={18} className="text-[#8F9BB3]" />
              <span className="text-[#8F9BB3] font-semibold">Data de Início:</span>
              <span className="text-white font-medium">{obra.data || 'Não informada'}</span>
            </div>
          </div>

          {/* Tabela de Materiais Utilizados */}
          <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-[#2A2F55] flex items-center gap-3">
              <Package className="text-[#FFCA18]" size={24} />
              <h2 className="text-lg font-bold text-white">Materiais Utilizados nesta Obra (Integrados ao Estoque)</h2>
            </div>

            {obra.materiais_utilizados && obra.materiais_utilizados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-[#1B1F3B] text-[#8F9BB3]">
                    <tr>
                      <th className="px-6 py-4 font-bold">Material</th>
                      <th className="px-6 py-4 font-bold">Fornecedor</th>
                      <th className="px-6 py-4 font-bold text-center">Quantidade</th>
                      <th className="px-6 py-4 font-bold">V. Unitário</th>
                      <th className="px-6 py-4 font-bold">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2F55]">
                    {obra.materiais_utilizados.map((mat, index) => (
                      <tr key={index} className="hover:bg-[#1B1F3B] transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{mat.nome}</td>
                        <td className="px-6 py-4 text-[#8F9BB3]">{mat.fornecedor || 'Não informado'}</td>
                        <td className="px-6 py-4 text-center font-bold text-white">
                          <span className="bg-[#1B1F3B] px-3 py-1 rounded-lg border border-[#2A2F55]">{mat.quantidade}</span>
                        </td>
                        <td className="px-6 py-4 text-[#8F9BB3]">R$ {Number(mat.valorUnitario || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-bold text-green-400">R$ {Number(mat.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-[#8F9BB3]">
                Nenhum material registado nesta obra.
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}