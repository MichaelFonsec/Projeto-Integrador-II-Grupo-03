import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, PackageOpen, PlusCircle, Trash2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; 
import { collection, getDocs, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore'; 
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

const colunasAlocados = [
  {
    key: 'nome',
    header: 'Material',
    primary: true,
    textClassName: 'font-medium text-white',
    render: (item) => item.nome
  },
  {
    key: 'fornecedor',
    header: 'Fornecedor do Material',
    textClassName: 'text-[#8F9BB3]',
    render: (item) => (
      <span className="bg-[#0B0E26] px-3 py-1 rounded-lg border border-[#2A2F55] text-xs text-[#FFCA18] font-semibold">
        {item.fornecedor || 'Não informado'}
      </span>
    )
  },
  {
    key: 'quantidade',
    header: 'Qtd Alocada',
    align: 'center',
    textClassName: 'font-bold text-white',
    render: (item) => (
      <span className="bg-[#1B1F3B] px-3 py-1 rounded-lg border border-[#2A2F55]">
        {item.quantidade} un.
      </span>
    )
  },
  {
    key: 'valorTotal',
    header: 'Valor Total',
    textClassName: 'font-medium text-green-400',
    render: (item) => `R$ ${Number(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }
];

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
        querySnapshot.forEach((docSnap) => itens.push({ id: docSnap.id, ...docSnap.data() }));
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
      fornecedor: item.fornecedor || 'Não informado', 
      quantidade: '', 
      valorUnitario: item.valorUnitario, 
      maxDisponivel: item.quantidade 
    });
  };

  const totalGastoMateriais = materiais.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0);
  const orcamentoTotalNum = Number(formData.orcamento) || 0;
  const saldoRestante = orcamentoTotalNum - totalGastoMateriais;

  const handleAddMaterial = () => {
    const qtd = Number(novoMaterial.quantidade);
    if (!novoMaterial.estoqueId || qtd <= 0) return;
    
    if (qtd > novoMaterial.maxDisponivel) { 
      alert(`Quantidade indisponível! Só tem ${novoMaterial.maxDisponivel} un. disponíveis no estoque.`); 
      return; 
    }

    const valorNovoMaterial = qtd * Number(novoMaterial.valorUnitario);

    if (orcamentoTotalNum > 0 && (totalGastoMateriais + valorNovoMaterial > orcamentoTotalNum)) {
      alert(`Atenção: A adição deste material (R$ ${valorNovoMaterial.toFixed(2)}) fará com que o gasto total ultrapasse o orçamento previsto de R$ ${orcamentoTotalNum.toFixed(2)}.`);
      return;
    }

    const materialCompleto = { 
      estoqueId: novoMaterial.estoqueId, 
      nome: novoMaterial.nome, 
      fornecedor: novoMaterial.fornecedor, 
      quantidade: qtd, 
      valorUnitario: Number(novoMaterial.valorUnitario), 
      valorTotal: valorNovoMaterial 
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

    if (orcamentoTotalNum > 0 && totalGastoMateriais > orcamentoTotalNum) {
      alert("Erro: O valor total dos materiais não pode ultrapassar o orçamento total da obra.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const batch = writeBatch(db);

      const novaObraRef = doc(collection(db, 'obras'));
      batch.set(novaObraRef, { 
        nome: formData.nome, 
        local: formData.local, 
        data: formData.data, 
        status: formData.status || 'Em andamento', 
        orcamentoTotal: orcamentoTotalNum, 
        materiais_utilizados: materiais, 
        createdAt: serverTimestamp() 
      });

      const logObraRef = doc(collection(db, 'movimentacoes'));
      batch.set(logObraRef, {
        tipo: 'CRIACAO', 
        modulo: 'Obras', 
        descricao: `Criou a obra: ${formData.nome} (Status: ${formData.status || 'Em andamento'})`,
        usuario: userData?.usuario || currentUser?.email || 'Utilizador', 
        data: serverTimestamp()
      });

      materiais.forEach((mat) => {
        const estoqueRef = doc(db, 'estoque', mat.estoqueId);
        batch.update(estoqueRef, { quantidade: increment(-mat.quantidade) });
        
        const logSaidaRef = doc(collection(db, 'movimentacoes'));
        batch.set(logSaidaRef, {
          tipo: 'SAIDA', 
          modulo: 'Estoque -> Obra', 
          descricao: `Alocou ${mat.quantidade} un. de ${mat.nome} para a obra "${formData.nome}"`,
          usuario: userData?.usuario || currentUser?.email || 'Utilizador', 
          data: serverTimestamp()
        });
      });
      
      await batch.commit();
      navigate('/');
    } catch (error) { 
      console.error("Erro ao salvar:", error); 
      alert("Erro ao salvar a obra. Verifique a consola."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="flex-1 bg-[#0B0E26] p-4 sm:p-6 md:p-8 text-white transition-colors duration-200 min-w-0 overflow-y-auto">
      
      <div className="flex items-center gap-4 mb-10">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 bg-[#1B1F3B] rounded-xl hover:bg-[#2A2F55] transition-colors text-[#8F9BB3] hover:text-white cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Cadastrar Nova Obra</h1>
          <p className="text-[#8F9BB3]">Preencha os dados e aloque os materiais do seu estoque (materiais alocados são descontados imediatamente).</p>
        </div>
      </div>

      <div className="max-w-6xl bg-[#111535] border border-[#2A2F55] rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
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
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Status Inicial</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange} 
                  className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors cursor-pointer"
                >
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1B1F3B]/60 p-5 rounded-2xl border border-[#2A2F55]">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFCA18]/10 p-2.5 rounded-xl text-[#FFCA18]"><DollarSign size={20} /></div>
              <div>
                <p className="text-[11px] text-[#8F9BB3] font-bold uppercase">Orçamento Total</p>
                <p className="text-base font-bold text-white">R$ {orcamentoTotalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2.5 rounded-xl text-red-400"><DollarSign size={20} /></div>
              <div>
                <p className="text-[11px] text-[#8F9BB3] font-bold uppercase">Valor Gasto (Materiais)</p>
                <p className="text-base font-bold text-red-400">R$ {totalGastoMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${saldoRestante >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}><DollarSign size={20} /></div>
              <div>
                <p className="text-[11px] text-[#8F9BB3] font-bold uppercase">Saldo Restante</p>
                <p className={`text-base font-bold ${saldoRestante >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {saldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-2 text-[#FFCA18] flex items-center gap-2">
              <PackageOpen size={20} /> Alocar Materiais do Estoque
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 items-end bg-[#1B1F3B]/50 p-4 rounded-xl border border-[#2A2F55]">
              <div className="flex-1 w-full">
                <label className="text-sm font-bold text-[#8F9BB3] mb-2 block">Selecionar Material (Material | Fornecedor | Quantidade)</label>
                {loadingEstoque ? (
                  <div className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-[#4A5578]">
                    A carregar estoque...
                  </div>
                ) : (
                  <select 
                    value={novoMaterial.estoqueId} 
                    onChange={handleSelectEstoque} 
                    className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none transition-colors cursor-pointer"
                  >
                    <option value="">-- Escolha um material --</option>
                    {estoqueDisponivel.map(item => (
                      <option key={item.id} value={item.id} disabled={item.quantidade <= 0}>
                        {item.nome} — [Fornecedor: {item.fornecedor || 'Não informado'}] — [Qtd Disp: {item.quantidade}]
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
                className="w-full md:w-auto px-6 py-3 bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle size={18} className="text-green-400 mr-2" /> Adicionar
              </button>
            </div>

            {materiais.length > 0 && (
              <ResponsiveTable
                columns={colunasAlocados}
                data={materiais}
                rowKey={(_, index) => index}
                actions={(item, index) => [
                  { label: 'Remover', icon: Trash2, variant: 'danger', iconOnly: true, onClick: () => handleRemoveMaterial(index) }
                ]}
                actionsHeader="Ação"
                actionsAlign="center"
                className="bg-[#1B1F3B] rounded-xl border border-[#2A2F55] overflow-hidden mt-4"
                headerClassName="bg-[#2A2F55] text-white"
                cardClassName="bg-[#111535] border border-[#2A2F55]"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-8 border-t border-[#2A2F55] mt-8">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#8F9BB3] hover:text-white hover:bg-[#1B1F3B] transition-colors cursor-pointer"
            >
              <X size={18} /> Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] transition-all shadow-[0_0_15px_rgba(255,202,24,0.15)] disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} /> {isSubmitting ? 'A salvar...' : 'Salvar Obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}