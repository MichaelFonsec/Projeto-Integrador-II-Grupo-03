import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  PackageSearch, Plus, Download, Send, 
  Layers, DollarSign, AlertTriangle, Tags, Search, Trash2 
} from 'lucide-react';

export default function Estoque() {
  const [Estoque, setEstoque] = useState([]);
  const [stats, setStats] = useState({ total: 0, valor: '0,00', minimo: 0, categorias: 5 });

  useEffect(() => {
    const fetchEstoque = async () => {
      const querySnapshot = await getDocs(collection(db, 'Estoque'));
      const prods = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEstoque(prods);
      setStats(prev => ({ ...prev, total: prods.length }));
    };
    fetchEstoque();
  }, []);

  return (
    <div className="animate-fade-in font-sans">
      
      {/* BLOCO TOPO: Título e Botões */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Estoque Geral</h1>
          <p className="text-sm text-[#4A5578]">Gestão central de materiais</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="bg-[#2B8BF6] hover:bg-[#2072ce] text-white font-bold text-sm py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-lg">
            <Plus size={16} /> CADASTRAR MATERIAL
          </button>
          <button className="bg-[#48C774] hover:bg-[#3ca862] text-white font-bold text-sm py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-lg">
            <Download size={16} /> ENTRADA DE ESTOQUE
          </button>
          <button className="bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] font-bold text-sm py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-lg">
            <Send size={16} /> ALOCAR PARA OBRA
          </button>
        </div>
      </div>

      {/* RESUMO: 4 Caixas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-[#2B8BF6]/10 p-3 rounded-xl text-[#2B8BF6]"><Layers size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-widest mb-1">Total de Materiais</p>
            <h3 className="text-2xl font-extrabold text-white">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-[#48C774]/10 p-3 rounded-xl text-[#48C774]"><DollarSign size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-widest mb-1">Valor em Estoque</p>
            <h3 className="text-2xl font-extrabold text-white">R$ {stats.valor}</h3>
          </div>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-[#E53E3E]/10 p-3 rounded-xl text-[#E53E3E]"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-widest mb-1">Estoque Mínimo</p>
            <h3 className="text-2xl font-extrabold text-white">{stats.minimo}</h3>
          </div>
        </div>
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 flex items-center gap-4">
          <div className="bg-[#FFCA18]/10 p-3 rounded-xl text-[#FFCA18]"><Tags size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-widest mb-1">Categorias</p>
            <h3 className="text-2xl font-extrabold text-white">{stats.categorias}</h3>
          </div>
        </div>
      </div>

      {/* PAINEL DE TABELA */}
      <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar material..." 
              className="w-full pl-11 pr-4 py-3 bg-[#1B1F3B] border border-[#2A2F55] rounded-xl text-sm text-white focus:outline-none focus:border-[#2B8BF6]"
            />
          </div>
          <select className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2B8BF6] w-full sm:w-auto min-w-[200px]">
            <option>Todas as Categorias</option>
            <option>Hidráulica</option>
            <option>Elétrica</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 pl-2">Material</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Categoria</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Unidade</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Saldo Geral</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Mínimo</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Custo Unitário</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 text-right pr-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {Estoque.map(prod => (
                <tr key={prod.id} className="group hover:bg-[#1B1F3B] transition-colors">
                  <td className="py-4 pl-2 border-b border-[#2A2F55] text-sm text-white font-bold flex items-center gap-3">
                    <div className="bg-[#1B1F3B] p-2 rounded-lg border border-[#2A2F55]"><PackageSearch size={16} className="text-[#8F9BB3]" /></div>
                    {prod.nome}
                  </td>
                  <td className="py-4 border-b border-[#2A2F55] text-sm text-[#8F9BB3]">Geral</td>
                  <td className="py-4 border-b border-[#2A2F55] text-sm text-[#8F9BB3]">UN</td>
                  <td className={`py-4 border-b border-[#2A2F55] text-sm font-bold ${prod.quantidade <= prod.estoqueMinimo ? 'text-[#E53E3E]' : 'text-[#48C774]'}`}>
                    {prod.quantidade}
                  </td>
                  <td className="py-4 border-b border-[#2A2F55] text-sm text-[#8F9BB3]">{prod.estoqueMinimo}</td>
                  <td className="py-4 border-b border-[#2A2F55] text-sm text-[#8F9BB3]">R$ 0,00</td>
                  <td className="py-4 pr-2 border-b border-[#2A2F55] text-right">
                    <button className="text-[#2B8BF6] hover:text-white text-xs font-bold mr-3">Editar</button>
                    <button className="text-[#FFCA18] hover:text-white text-xs font-bold">Alocar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}