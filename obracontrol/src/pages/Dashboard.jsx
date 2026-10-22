import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Download, Plus, ArrowRight, CheckCircle, Search, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ orcamento: '50.000,00', gasto: '12.500,00', totalItens: 0, alertas: 0 });
  const [historico, setHistorico] = useState([]);
  const [obraSelecionada, setObraSelecionada] = useState('Residencial Alpha');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const obras = ['Residencial Alpha', 'Edifício Horizon', 'Condomínio Solar'];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">{obraSelecionada} / Status</h1>
        <div className="flex flex-wrap gap-2">
          {/* Botão Selecionar Obra com Dropdown Customizado */}
          <div className="relative" ref={dropdownRef}>
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
            >
              <ChevronDown size={14} className={`transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              <span>{obraSelecionada}</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute left-0 mt-1 min-w-[170px] bg-[#1B1F3B] border border-[#2A2F55] rounded shadow-lg py-1 z-30">
                {obras.map((obra) => (
                  <button
                    key={obra}
                    type="button"
                    onClick={() => {
                      setObraSelecionada(obra);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                      obraSelecionada === obra
                        ? 'bg-[#2A2F55] text-white'
                        : 'text-[#8F9BB3] hover:text-white hover:bg-[#2A2F55]'
                    }`}
                  >
                    {obra}
                  </button>
                ))}
              </div>
            )}
          </div>

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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-sm font-bold text-white">Estoque da Obra</h3>
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F9BB3]" size={16} />
              <input 
                type="text" 
                placeholder="Buscar material na obra..." 
                className="w-full pl-10 pr-4 py-2.5 bg-[#1B1F3B] border border-[#2A2F55] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFCA18] transition-all" 
              />
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