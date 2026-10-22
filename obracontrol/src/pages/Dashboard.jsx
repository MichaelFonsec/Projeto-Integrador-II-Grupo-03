import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { Building2, Package, DollarSign, Plus, ChevronRight, MapPin } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [loadingObras, setLoadingObras] = useState(true);
  const [totalEstoqueItens, setTotalEstoqueItens] = useState(0);
  const [valorImobilizadoEstoque, setValorImobilizadoEstoque] = useState(0);

  useEffect(() => {
    const unsubObras = onSnapshot(collection(db, 'obras'), (snapshot) => {
      const obrasArray = [];
      snapshot.forEach((doc) => {
        obrasArray.push({ id: doc.id, ...doc.data() });
      });
      setObras(obrasArray);
      setLoadingObras(false);
    });

    const unsubEstoque = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      let somaItens = 0;
      let somaValor = 0;

      snapshot.forEach((doc) => {
        const item = doc.data();
        const qtd = Number(item.quantidade) || 0;
        const vUnit = Number(item.valorUnitario) || 0;
        const vTotal = Number(item.valorTotal) || (qtd * vUnit);

        somaItens += qtd;
        somaValor += vTotal;
      });

      setTotalEstoqueItens(somaItens);
      setValorImobilizadoEstoque(somaValor);
    });

    return () => {
      unsubObras();
      unsubEstoque();
    };
  }, []);

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto transition-colors duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Painel Principal</h1>
          <p className="text-[#8F9BB3]">Acompanhe o resumo das obras e o inventário em tempo real.</p>
        </div>
        
        <button 
          onClick={() => navigate('/nova-obra')}
          className="px-6 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
        >
          <Plus size={20} /> Nova Obra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex items-center gap-4">
          <div className="bg-[#FFCA18]/10 p-4 rounded-xl text-[#FFCA18]">
            <Building2 size={28} />
          </div>
          <div>
            <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Total de Obras</p>
            <p className="text-2xl font-bold text-white">{obras.length}</p>
          </div>
        </div>

        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-4 rounded-xl text-blue-400">
            <Package size={28} />
          </div>
          <div>
            <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Itens no Estoque</p>
            <p className="text-2xl font-bold text-white">{totalEstoqueItens}</p>
          </div>
        </div>

        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex items-center gap-4">
          <div className="bg-green-500/10 p-4 rounded-xl text-green-400">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Valor Imobilizado</p>
            <p className="text-2xl font-bold text-white">
              R$ {valorImobilizadoEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 className="text-[#FFCA18]" size={22} /> Obras em Andamento
        </h2>
      </div>

      {loadingObras ? (
        <div className="p-10 text-center text-[#8F9BB3]">A carregar projetos...</div>
      ) : obras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {obras.map((obra) => (
            <div 
              key={obra.id}
              onClick={() => navigate(`/obra/${obra.id}`)}
              className="bg-[#111535] border border-[#2A2F55] hover:border-[#FFCA18] rounded-2xl p-6 shadow-xl cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-[#FFCA18]/10 p-3 rounded-xl text-[#FFCA18]">
                    <Building2 size={24} />
                  </div>
                  <span className="text-xs px-3 py-1 bg-[#1B1F3B] border border-[#2A2F55] rounded-full text-[#8F9BB3]">
                    {obra.status || 'Em Andamento'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FFCA18] transition-colors">
                  {obra.nome}
                </h3>
                
                <p className="text-sm text-[#8F9BB3] mb-4 flex items-center gap-2">
                  <MapPin size={16} /> {obra.local || 'Localização não informada'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#2A2F55] flex items-center justify-between text-sm">
                <span className="text-green-400 font-bold">
                  {obra.orcamentoTotal ? `R$ ${Number(obra.orcamentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Orçamento livre'}
                </span>
                <span className="text-[#FFCA18] flex items-center gap-1 font-semibold group-hover:translate-x-1 transition-transform">
                  Ver Detalhes <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-12 text-center">
          <Building2 size={48} className="text-[#4A5578] mx-auto mb-4" />
          <p className="text-white text-lg font-bold mb-2">Nenhuma obra registada</p>
          <p className="text-[#8F9BB3] text-sm mb-6">Comece por cadastrar o seu primeiro projeto de construção.</p>
          <button 
            onClick={() => navigate('/nova-obra')}
            className="px-6 py-3 bg-[#FFCA18] text-[#0B0E26] rounded-xl font-bold hover:bg-[#e6b616] transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} /> Cadastrar Nova Obra
          </button>
        </div>
      )}
    </div>
  );
}