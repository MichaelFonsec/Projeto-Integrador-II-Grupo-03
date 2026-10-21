import React from 'react';
import { 
  FileText, 
  Filter, 
  FileDown, 
  BarChart3, 
  PieChart, 
  FolderArchive, 
  Eye 
} from 'lucide-react';

export default function Relatorios() {
  return (
    <div className="animate-fade-in font-sans">
      
      {/* BLOCO TOPO: Título e Botões */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText size={24} className="text-[#FFCA18]" /> Relatórios
          </h1>
          <p className="text-sm text-[#4A5578]">Análises, gráficos e fechamentos de obra</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Select de Filtro */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={16} />
            <select className="pl-9 pr-4 py-2.5 bg-[#1B1F3B] border border-[#2A2F55] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFCA18]/50 appearance-none min-w-[160px] shadow-lg cursor-pointer">
              <option>Filtrar Obra</option>
              <option>Residencial Alpha</option>
              <option>Edifício Beta</option>
            </select>
          </div>
          
          {/* Botões de Exportação */}
          <button className="bg-[#E53E3E]/10 hover:bg-[#E53E3E] text-[#E53E3E] hover:text-white border border-[#E53E3E]/20 font-bold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg">
            <FileDown size={18} /> EXPORTAR PDF
          </button>
          <button className="bg-[#48C774]/10 hover:bg-[#48C774] text-[#48C774] hover:text-white border border-[#48C774]/20 font-bold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg">
            <FileDown size={18} /> EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* ÁREA DOS GRÁFICOS (Lado a Lado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico 1 */}
        <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] shadow-lg flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#2B8BF6]" /> Gráfico Entradas vs Saídas
          </h3>
          <div className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl flex-1 min-h-[280px] flex flex-col items-center justify-center text-[#4A5578] shadow-inner">
            <BarChart3 size={48} className="mb-3 opacity-20" />
            <span className="text-sm font-bold tracking-widest uppercase">Área do Gráfico 1</span>
          </div>
        </div>

        {/* Gráfico 2 */}
        <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] shadow-lg flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-[#FFCA18]" /> Gráfico Orçado vs Gasto
          </h3>
          <div className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl flex-1 min-h-[280px] flex flex-col items-center justify-center text-[#4A5578] shadow-inner">
            <PieChart size={48} className="mb-3 opacity-20" />
            <span className="text-sm font-bold tracking-widest uppercase">Área do Gráfico 2</span>
          </div>
        </div>

      </div>

      {/* TABELA DE FECHAMENTO DE OBRAS */}
      <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <FolderArchive size={18} className="text-[#48C774]" /> Fechamento de Obras
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 pl-2">Obra</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Data Fechamento</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Total Gasto</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">Saldo Retornado</th>
                <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 text-right pr-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Linha de Exemplo conforme o Wireframe */}
              <tr className="group hover:bg-[#1B1F3B] transition-colors">
                <td className="py-4 pl-2 border-b border-[#2A2F55] text-sm text-white font-bold">---</td>
                <td className="py-4 border-b border-[#2A2F55] text-sm text-[#8F9BB3]">---</td>
                <td className="py-4 border-b border-[#2A2F55] text-sm font-bold text-[#E53E3E]">---</td>
                <td className="py-4 border-b border-[#2A2F55] text-sm font-bold text-[#48C774]">---</td>
                <td className="py-4 pr-2 border-b border-[#2A2F55] text-right">
                  <button className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-[#38bdf8] text-xs font-bold px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-2 shadow">
                    <Eye size={14} /> Ver Relatório
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}