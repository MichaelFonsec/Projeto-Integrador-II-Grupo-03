import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Download, Plus, ArrowRight, CheckCircle, DollarSign, TrendingDown, Package, AlertTriangle, Search } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ orcamento: '50.000,00', gasto: '12.500,00', totalItens: 0, alertas: 0 });
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    // Simulação de carregamento
    const fetchData = async () => {
      const estoqueSnap = await getDocs(collection(db, 'estoque'));
      setStats(prev => ({ ...prev, totalItens: estoqueSnap.size, alertas: 2 }));
      const movQuery = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), limit(3));
      const movSnap = await getDocs(movQuery);
      setHistorico(movSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in font-sans">
      {/* Bloco Topo */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-lg font-bold text-white uppercase tracking-wider">Nome da Obra / Status</h1>
        <div className="flex flex-wrap gap-2">
          <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
            <Download size={14} /> Alocar do Geral
          </button>
          <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
            <Plus size={14} /> Entrada Direta
          </button>
          <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
            <ArrowRight size={14} /> Transferir
          </button>
          <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
            <CheckCircle size={14} /> Encerrar Obra
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111535] border border-[#2A2F55] rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-[#8F9BB3] mb-2">Orçamento</p>
          <h3 className="text-xl font-bold text-white">R$ {stats.orcamento}</h3>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-[#8F9BB3] mb-2">Gasto</p>
          <h3 className="text-xl font-bold text-[#E53E3E]">R$ {stats.gasto}</h3>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-[#8F9BB3] mb-2">Total de Itens</p>
          <h3 className="text-xl font-bold text-white">{stats.totalItens}</h3>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-xl p-5 relative overflow-hidden">
          <p className="text-xs font-bold text-[#8F9BB3] mb-2">Alertas</p>
          <h3 className="text-xl font-bold text-[#FFCA18]">{stats.alertas}</h3>
        </div>
      </div>

      {/* Área Dividida */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">
        {/* Estoque da Obra */}
        <div className="bg-[#111535] rounded-xl p-5 border border-[#2A2F55] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white">Estoque da Obra</h3>
            <div className="relative">
              <input type="text" placeholder="Buscar" className="pl-3 pr-3 py-1.5 bg-[#1B1F3B] border border-[#2A2F55] rounded text-sm text-white focus:outline-none focus:border-[#FFCA18]" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Material</th>
                  <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Alocado</th>
                  <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Usado</th>
                  <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Saldo</th>
                  <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#1B1F3B]">
                  <td className="border border-[#2A2F55] p-2 text-sm text-white">Cimento 50kg</td>
                  <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">100</td>
                  <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">40</td>
                  <td className="border border-[#2A2F55] p-2 text-sm text-white">60</td>
                  <td className="border border-[#2A2F55] p-2">
                    <button className="border border-[#2A2F55] bg-[#1B1F3B] hover:bg-[#2A2F55] text-white text-xs px-2 py-1 rounded mr-2">Baixar</button>
                    <button className="border border-[#2A2F55] bg-[#1B1F3B] hover:bg-[#2A2F55] text-white text-xs px-2 py-1 rounded">Transferir</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-[#111535] rounded-xl p-5 border border-[#2A2F55]">
          <h3 className="text-sm font-bold text-white mb-4">Histórico</h3>
          <div className="flex flex-col">
            <div className="border-b border-[#2A2F55] py-3 text-sm text-[#8F9BB3]">Registro 1</div>
            <div className="border-b border-[#2A2F55] py-3 text-sm text-[#8F9BB3]">Registro 2</div>
            <div className="border-b border-[#2A2F55] py-3 text-sm text-[#8F9BB3]">Registro 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}