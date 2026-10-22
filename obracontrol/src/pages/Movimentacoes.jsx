import React from 'react';
import { Plus } from 'lucide-react';

export default function Movimentacoes() {
  return (
    <div className="animate-fade-in font-sans">
      
      {/* Bloco Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Movimentações</h1>
          <p className="text-sm text-[#4A5578]">Histórico e transferências de materiais</p>
        </div>
        <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
          <Plus size={14} /> Nova Transferência
        </button>
      </div>

      {/* Painel Principal */}
      <div className="bg-[#111535] rounded-xl p-5 border border-[#2A2F55]">
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select className="bg-[#1B1F3B] border border-[#2A2F55] px-3 py-1.5 text-sm text-white rounded focus:outline-none w-[120px]">
            <option>Tipo</option>
          </select>
          <select className="bg-[#1B1F3B] border border-[#2A2F55] px-3 py-1.5 text-sm text-white rounded focus:outline-none w-[120px]">
            <option>Origem</option>
          </select>
          <select className="bg-[#1B1F3B] border border-[#2A2F55] px-3 py-1.5 text-sm text-white rounded focus:outline-none w-[120px]">
            <option>Destino</option>
          </select>
          <input type="date" className="bg-[#1B1F3B] border border-[#2A2F55] px-3 py-1.5 text-sm text-[#8F9BB3] rounded focus:outline-none" />
          <input type="text" placeholder="Buscar" className="bg-[#1B1F3B] border border-[#2A2F55] px-3 py-1.5 text-sm text-white rounded focus:outline-none flex-1 min-w-[150px]" />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Data</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Tipo</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Material</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Quantidade</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Origem</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Destino</th>
                <th className="border border-[#2A2F55] p-2 bg-[#1B1F3B] text-xs font-bold text-[#8F9BB3]">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {/* Linha de exemplo baseada no wireframe */}
              <tr className="hover:bg-[#1B1F3B]">
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
                <td className="border border-[#2A2F55] p-2 text-sm text-[#8F9BB3]">---</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}