import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  FileText, 
  Filter, 
  FileDown, 
  BarChart3, 
  PieChart, 
  FolderArchive, 
  Eye, 
  DollarSign, 
  Package, 
  Building2,
  TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Relatorios() {
  const [obras, setObras] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [obraSelecionada, setObraSelecionada] = useState('TODAS');

  useEffect(() => {
    const unsubObras = onSnapshot(collection(db, 'obras'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setObras(data);
    });

    const unsubEstoque = onSnapshot(collection(db, 'estoque'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setEstoque(data);
    });

    const unsubMov = onSnapshot(collection(db, 'movimentacoes'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setMovimentacoes(data);
      setLoading(false);
    });

    return () => {
      unsubObras();
      unsubEstoque();
      unsubMov();
    };
  }, []);

  const obrasFiltradas = obraSelecionada === 'TODAS' 
    ? obras 
    : obras.filter(o => o.id === obraSelecionada || o.nome === obraSelecionada);

  const totalOrcado = obrasFiltradas.reduce((acc, o) => acc + (Number(o.orcamentoTotal) || Number(o.orcamento) || 0), 0);
  
  const totalGastoObras = obrasFiltradas.reduce((acc, o) => {
    if (o.materiais_utilizados && Array.isArray(o.materiais_utilizados)) {
      const gastoMats = o.materiais_utilizados.reduce((sub, m) => sub + (Number(m.valorTotal) || 0), 0);
      return acc + gastoMats;
    }
    return acc;
  }, 0);

  const valorTotalEstoque = estoque.reduce((acc, e) => acc + (Number(e.valorTotal) || (Number(e.quantidade || 0) * Number(e.valorUnitario || 0))), 0);
  const totalItensEstoque = estoque.reduce((acc, e) => acc + (Number(e.quantidade) || 0), 0);

  const totalEntradas = movimentacoes.filter(m => m.tipo === 'ENTRADA').length;
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'SAIDA' || m.tipo === 'EDICAO' || m.modulo === 'Obras').length;

  // Cálculo proporcional dinâmico para as barras do gráfico
  const maxMov = Math.max(totalEntradas, totalSaidas, 1);
  const alturaEntradasPct = Math.max(30, (totalEntradas / maxMov) * 100);
  const alturaSaidasPct = Math.max(30, (totalSaidas / maxMov) * 100);

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const resumoData = [
      ["Relatório Executivo de Obras e Estoque"],
      ["Data de Emissão:", new Date().toLocaleDateString('pt-PT')],
      [""],
      ["Métrica", "Valor"],
      ["Total de Obras Mapeadas", obrasFiltradas.length],
      ["Orçamento Total Previsto", totalOrcado],
      ["Total Gasto em Materiais", totalGastoObras],
      ["Saldo Restante / Retornado", totalOrcado - totalGastoObras],
      ["Total de Itens no Estoque", totalItensEstoque],
      ["Valor Imobilizado no Estoque", valorTotalEstoque]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");

    const obrasData = [];
    obrasFiltradas.forEach(o => {
      if (o.materiais_utilizados && o.materiais_utilizados.length > 0) {
        o.materiais_utilizados.forEach(m => {
          obrasData.push({
            "Obra": o.nome || 'N/D',
            "Status": o.status || 'Em Andamento',
            "Local": o.local || 'N/D',
            "Material": m.nome || 'N/D',
            "Fornecedor": m.fornecedor || 'N/D',
            "Quantidade": m.quantidade || 0,
            "Valor Unitário (R$)": m.valorUnitario || 0,
            "Valor Total (R$)": m.valorTotal || 0
          });
        });
      } else {
        obrasData.push({
          "Obra": o.nome || 'N/D',
          "Status": o.status || 'Em Andamento',
          "Local": o.local || 'N/D',
          "Material": "Nenhum material registado",
          "Fornecedor": "-",
          "Quantidade": 0,
          "Valor Unitário (R$)": 0,
          "Valor Total (R$)": 0
        });
      }
    });
    const wsObras = XLSX.utils.json_to_sheet(obrasData);
    XLSX.utils.book_append_sheet(wb, wsObras, "Obras e Materiais");

    const estoqueData = estoque.map(e => ({
      "Material": e.nome || 'N/D',
      "Fornecedor": e.fornecedor || 'N/D',
      "Quantidade em Estoque": e.quantidade || 0,
      "Valor Unitário (R$)": e.valorUnitario || 0,
      "Valor Total (R$)": e.valorTotal || (Number(e.quantidade || 0) * Number(e.valorUnitario || 0))
    }));
    const wsEstoque = XLSX.utils.json_to_sheet(estoqueData);
    XLSX.utils.book_append_sheet(wb, wsEstoque, "Estoque Geral");

    XLSX.writeFile(wb, `Relatorio_Obras_Estoque_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(11, 14, 38);
    doc.text("Relatório Geral de Obras e Estoque", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}`, 14, 27);

    autoTable(doc, {
      startY: 35,
      head: [['Métrica Consolidada', 'Valor']],
      body: [
        ['Total de Obras', obrasFiltradas.length],
        ['Orçamento Total Previsto', `R$ ${totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total Gasto em Materiais', `R$ ${totalGastoObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Saldo Estimado', `R$ ${(totalOrcado - totalGastoObras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Imobilizado (Estoque)', `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [17, 21, 53] }
    });

    const bodyObras = [];
    obrasFiltradas.forEach(o => {
      const gasto = o.materiais_utilizados ? o.materiais_utilizados.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0) : 0;
      bodyObras.push([
        o.nome || 'N/D',
        o.status || 'Em Andamento',
        o.local || 'N/D',
        `R$ ${Number(o.orcamentoTotal || o.orcamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Nome da Obra', 'Status', 'Local', 'Orçamento', 'Gasto Total']],
      body: bodyObras,
      theme: 'grid',
      headStyles: { fillColor: [255, 202, 24], textColor: [11, 14, 38] }
    });

    doc.save(`Relatorio_Obras_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white flex items-center justify-center">
        <p className="text-[#8F9BB3]">A carregar relatórios e dados analíticos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto transition-colors duration-200">
      
      {/* BLOCO TOPO: Título e Botões */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileText size={26} className="text-[#FFCA18]" /> RELATÓRIOS & ANÁLISES
          </h1>
          <p className="text-sm text-[#8F9BB3] mt-1">Indicadores financeiros, controlo de stock e fechamento de obras</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Select de Filtro por Obra */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F9BB3]" size={16} />
            <select 
              value={obraSelecionada} 
              onChange={(e) => setObraSelecionada(e.target.value)}
              className="pl-10 pr-6 py-2.5 bg-[#111535] border border-[#2A2F55] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFCA18] appearance-none min-w-[200px] shadow-lg cursor-pointer transition-colors"
            >
              <option value="TODAS">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          
          {/* Botões de Exportação */}
          <button 
            onClick={exportarPDF}
            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <FileDown size={16} /> EXPORTAR PDF
          </button>
          <button 
            onClick={exportarExcel}
            className="bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <FileDown size={16} /> EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="bg-[#FFCA18]/10 p-3.5 rounded-xl text-[#FFCA18]">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#8F9BB3] font-bold uppercase tracking-wider">Obras Analisadas</p>
            <p className="text-xl font-bold text-white mt-0.5">{obrasFiltradas.length}</p>
          </div>
        </div>

        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="bg-green-500/10 p-3.5 rounded-xl text-green-400">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#8F9BB3] font-bold uppercase tracking-wider">Orçamento Total</p>
            <p className="text-base font-bold text-white mt-0.5">R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="bg-red-500/10 p-3.5 rounded-xl text-red-400">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#8F9BB3] font-bold uppercase tracking-wider">Gasto em Materiais</p>
            <p className="text-base font-bold text-white mt-0.5">R$ {totalGastoObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3.5 rounded-xl text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[11px] text-[#8F9BB3] font-bold uppercase tracking-wider">Estoque Imobilizado</p>
            <p className="text-base font-bold text-white mt-0.5">R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* ÁREA DOS GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico 1: Movimentações (Design Aprimorado) */}
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#2B8BF6]" /> Gráfico Entradas vs Saídas (Movimentações)
          </h3>
          <div className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl flex-1 min-h-[280px] p-6 flex flex-col justify-end">
            <div className="flex justify-around items-end h-48 gap-16 border-b border-[#2A2F55] pb-3 relative">
              
              {/* Barra de Entradas */}
              <div className="flex flex-col items-center gap-2.5 flex-1 max-w-[140px] h-full justify-end">
                <span className="text-xs font-extrabold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/30 shadow">
                  {totalEntradas}
                </span>
                <div 
                  className="w-full bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-t-xl shadow-lg shadow-green-500/20 transition-all duration-700" 
                  style={{ height: `${alturaEntradasPct}%` }}
                ></div>
                <span className="text-xs font-bold text-[#8F9BB3] text-center mt-1">Entradas</span>
              </div>

              {/* Barra de Saídas */}
              <div className="flex flex-col items-center gap-2.5 flex-1 max-w-[140px] h-full justify-end">
                <span className="text-xs font-extrabold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30 shadow">
                  {totalSaidas}
                </span>
                <div 
                  className="w-full bg-gradient-to-t from-red-600 via-red-500 to-red-400 rounded-t-xl shadow-lg shadow-red-500/20 transition-all duration-700" 
                  style={{ height: `${alturaSaidasPct}%` }}
                ></div>
                <span className="text-xs font-bold text-[#8F9BB3] text-center mt-1">Saídas / Aplicações</span>
              </div>

            </div>
            <p className="text-center mt-4 text-[11px] text-[#8F9BB3]">Atualizado automaticamente em tempo real</p>
          </div>
        </div>

        {/* Gráfico 2: Orçamento vs Gasto */}
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <PieChart size={18} className="text-[#FFCA18]" /> Gráfico Orçamento Total vs Gasto Real
          </h3>
          <div className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl flex-1 min-h-[280px] p-6 flex flex-col justify-center gap-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#8F9BB3]">Orçamento Previsto</span>
                <span className="text-white">R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-[#0B0E26] h-4 rounded-full overflow-hidden border border-[#2A2F55] shadow-inner">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-[#8F9BB3]">Gasto Total Real</span>
                <span className="text-red-400">R$ {totalGastoObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-[#0B0E26] h-4 rounded-full overflow-hidden border border-[#2A2F55] shadow-inner">
                <div className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all" style={{ width: `${totalOrcado > 0 ? Math.min(100, (totalGastoObras / totalOrcado) * 100) : 0}%` }}></div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2A2F55] flex justify-between text-xs font-bold">
              <span className="text-[#8F9BB3]">Saldo Restante Global:</span>
              <span className={totalOrcado - totalGastoObras >= 0 ? "text-green-400" : "text-red-400"}>
                R$ {(totalOrcado - totalGastoObras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* TABELA DE FECHAMENTO DE OBRAS */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <FolderArchive size={18} className="text-green-400" /> Fechamento e Resumo de Obras
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#2A2F55]">
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3 pl-3">Obra</th>
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3">Status</th>
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3">Orçamento</th>
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3">Total Gasto</th>
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3">Saldo / Diferença</th>
                <th className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider pb-3 text-right pr-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F55]/50">
              {obras.length > 0 ? (
                obras.map(obra => {
                  const orc = Number(obra.orcamentoTotal || obra.orcamento || 0);
                  const gasto = obra.materiais_utilizados ? obra.materiais_utilizados.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0) : 0;
                  const saldo = orc - gasto;

                  return (
                    <tr key={obra.id} className="group hover:bg-[#1B1F3B]/50 transition-colors">
                      <td className="py-4 pl-3 text-sm text-white font-bold">{obra.nome}</td>
                      <td className="py-4 text-sm text-[#8F9BB3]">
                        <span className="px-3 py-1 bg-[#1B1F3B] border border-[#2A2F55] rounded-full text-xs font-medium">
                          {obra.status || 'Em Andamento'}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-bold text-white">R$ {orc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 text-sm font-bold text-red-400">R$ {gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className={`py-4 text-sm font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 pr-3 text-right">
                        <button 
                          onClick={() => window.location.href = `/obra/${obra.id}`}
                          className="bg-[#1B1F3B] hover:bg-[#2A2F55] border border-[#2A2F55] text-sky-400 text-xs font-bold px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <Eye size={14} /> Ver Obra
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#8F9BB3] text-sm">Nenhuma obra registada para fechamento.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}