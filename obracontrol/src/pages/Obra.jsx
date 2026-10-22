import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, PackageOpen, PlusCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; 
import { collection, getDocs, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore'; 
import { useAuth } from '../contexts/AuthContext';

export default function NovaObra() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estoqueDisponivel, setEstoqueDisponivel] = useState([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);

  const [formData, setFormData] = useState({ 
    nome: '', 
    local: '', 
    data: '', 
    status: 'Em andamento', 
    orcamento: '' 
  });
  
  const [materiais, setMateriais] = useState([]);
  const [novoMaterial, setNovoMaterial] = useState({ 
    estoqueId: '', 
    nome: '', 
    fornecedor: '', 
    quantidade: '', 
    valorUnitario: '', 
    maxDisponivel: 0 
  });

  useEffect(() => {
    const fetchEstoque = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'estoque'));
        const itens = [];
        querySnapshot.forEach((doc) => itens.push({ id: doc.id, ...doc.data() }));
        setEstoqueDisponivel(itens);
      } catch (error) { 
        console.error("Erro ao carregar estoque:", error); 
      } finally { 
        setLoadingEstoque(false); 
      }
    };
    fetchEstoque();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectEstoque = (e) => {
    const id = e.target.value;
    if (!id) { 
      setNovoMaterial({ estoqueId: '', nome: '', fornecedor: '', quantidade: '', valorUnitario: '', maxDisponivel: 0 }); 
      return; 
    }
    const item = estoqueDisponivel.find(i => i.id === id);
    setNovoMaterial({ 
      estoqueId: item.id, 
      nome: item.nome, 
      fornecedor: item.fornecedor, 
      quantidade: '', 
      valorUnitario: item.valorUnitario, 
      maxDisponivel: item.quantidade 
    });
  };

  const handleAddMaterial = () => {
    const qtd = Number(novoMaterial.quantidade);
    if (!novoMaterial.estoqueId || qtd <= 0) return;
    if (qtd > novoMaterial.maxDisponivel) { 
      alert(`Quantidade indisponível! Você só tem ${novoMaterial.maxDisponivel} un. no estoque.`); 
      return; 
    }

    const materialCompleto = { 
      estoqueId: novoMaterial.estoqueId, 
      nome: novoMaterial.nome, 
      fornecedor: novoMaterial.fornecedor, 
      quantidade: qtd, 
      valorUnitario: Number(novoMaterial.valorUnitario), 
      valorTotal: qtd * Number(novoMaterial.valorUnitario) 
    };
    
    setMateriais([...materiais, materialCompleto]);
    setEstoqueDisponivel(estoqueDisponivel.map(item => 
      item.id === novoMaterial.estoqueId 
        ? { ...item, quantidade: item.quantidade - qtd } 
        : item
    ));
    setNovoMaterial({ estoqueId: '', nome: '', fornecedor: '', quantidade: '', valorUnitario: '', maxDisponivel: 0 });
  };

  const handleRemoveMaterial = (indexParaRemover) => {
    const mat = materiais[indexParaRemover];
    setEstoqueDisponivel(estoqueDisponivel.map(item => 
      item.id === mat.estoqueId 
        ? { ...item, quantidade: item.quantidade + mat.quantidade } 
        : item
    ));
    setMateriais(materiais.filter((_, index) => index !== indexParaRemover));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const batch = writeBatch(db);

      // 1. Salvar Obra
      const novaObraRef = doc(collection(db, 'obras'));
      batch.set(novaObraRef, { 
        nome: formData.nome, 
        local: formData.local, 
        data: formData.data, 
        status: formData.status, 
        orcamentoTotal: Number(formData.orcamento), 
        materiais_utilizados: materiais, 
        createdAt: serverTimestamp() 
      });

      // 2. Gravar LOG de Criação
      const logObraRef = doc(collection(db, 'movimentacoes'));
      batch.set(logObraRef, {
        tipo: 'CRIACAO', 
        modulo: 'Obras', 
        descricao: `Criou a obra: ${formData.nome}`,
        usuario: userData?.usuario || currentUser?.email || 'Usuário Desconhecido', 
        data: serverTimestamp()
      });

      // 3. Descontar Estoque e Gravar LOGs de Saída
      materiais.forEach((mat) => {
        const estoqueRef = doc(db, 'estoque', mat.estoqueId);
        batch.update(estoqueRef, { quantidade: increment(-mat.quantidade) });
        
        const logSaidaRef = doc(collection(db, 'movimentacoes'));
        batch.set(logSaidaRef, {
          tipo: 'SAIDA', 
          modulo: 'Estoque -> Obra', 
          descricao: `Alocou ${mat.quantidade} un. de ${mat.nome} para a obra "${formData.nome}"`,
          usuario: userData?.usuario || currentUser?.email || 'Usuário Desconhecido', 
          data: serverTimestamp()
        });
      });
      
      await batch.commit();
      navigate('/');
    } catch (error) { 
      console.error("Erro ao salvar:", error); 
      alert("Erro ao salvar a obra. Verifique o console."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto">
      
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-[#1B1F3B] rounded-xl hover:bg-[#2A2F55] transition-colors text-[#8F9BB3] hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Cadastrar Nova Obra</h1>
          <p className="text-[#8F9BB3]">Preencha os dados e aloque os materiais do seu estoque.</p>
        </div>
      </div>

      <div className="max-w-6xl bg-[#111535] border border-[#2A2F55] rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Informações Gerais */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-2 text-[#FFCA18]">
              Informações Gerais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Nome da Obra</label>
                <input 
                  type="text" 
                  name="nome" 
                  value={formData.nome} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Orçamento Previsto (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="orcamento" 
                  value={formData.orcamento} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Localização</label>
                <input 
                  type="text" 
                  name="local" 
                  value={formData.local} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Data de Início</label>
                <input 
                  type="date" 
                  name="data" 
                  value={formData.data} 
                  onChange={handleChange} 
                  required 
                  style={{ colorScheme: 'dark' }} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors"
                >
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materiais Utilizados */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-2 text-[#FFCA18] flex items-center gap-2">
              <PackageOpen size={20} /> Alocar Materiais do Estoque
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 items-end bg-[#1B1F3B]/50 p-4 rounded-xl border border-[#2A2F55]">
              <div className="flex-1 w-full">
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Selecionar Material no Estoque</label>
                {loadingEstoque ? (
                  <div className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-[#4A5578]">
                    Carregando estoque...
                  </div>
                ) : (
                  <select 
                    value={novoMaterial.estoqueId} 
                    onChange={handleSelectEstoque} 
                    className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors"
                  >
                    <option value="">-- Escolha um material --</option>
                    {estoqueDisponivel.map(item => (
                      <option key={item.id} value={item.id} disabled={item.quantidade <= 0}>
                        {item.nome} {item.quantidade <= 0 ? '(Esgotado)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="w-full md:w-32">
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 flex justify-between">
                  Qtd. {novoMaterial.estoqueId && <span className="text-[#FFCA18]">Disp: {novoMaterial.maxDisponivel}</span>}
                </label>
                <input 
                  type="number" 
                  value={novoMaterial.quantidade} 
                  onChange={(e) => setNovoMaterial({...novoMaterial, quantidade: e.target.value})} 
                  min="1" 
                  max={novoMaterial.maxDisponivel} 
                  disabled={!novoMaterial.estoqueId} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none disabled:opacity-50 transition-colors" 
                />
              </div>
              
              <button 
                type="button" 
                onClick={handleAddMaterial} 
                disabled={!novoMaterial.estoqueId || !novoMaterial.quantidade} 
                className="w-full md:w-auto px-6 py-3 bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <PlusCircle size={18} className="text-green-400 mr-2" /> Adicionar
              </button>
            </div>

            {materiais.length > 0 && (
              <div className="bg-[#1B1F3B] rounded-xl border border-[#2A2F55] overflow-hidden mt-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#2A2F55] text-white">
                    <tr>
                      <th className="px-4 py-3 font-bold">Material</th>
                      <th className="px-4 py-3 font-bold text-center">Qtd Alocada</th>
                      <th className="px-4 py-3 font-bold">Valor Total</th>
                      <th className="px-4 py-3 font-bold text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2F55]">
                    {materiais.map((item, index) => (
                      <tr key={index} className="hover:bg-[#2A2F55]/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">
                          {item.nome} 
                          <span className="block text-xs text-[#8F9BB3] mt-1">{item.fornecedor}</span>
                        </td>
                        <td className="px-4 py-3 text-white text-center font-bold">{item.quantidade}</td>
                        <td className="px-4 py-3 text-red-400 font-medium">
                          R$ {item.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMaterial(index)} 
                            className="text-[#4A5578] hover:text-red-500 transition-colors p-1 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-[#2A2F55] mt-8">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#8F9BB3] hover:text-white hover:bg-[#1B1F3B] transition-colors"
            >
              <X size={18} /> Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] transition-all shadow-[0_0_15px_rgba(255,202,24,0.15)] disabled:opacity-50"
            >
              <Save size={18} /> {isSubmitting ? 'Salvando...' : 'Salvar Obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}