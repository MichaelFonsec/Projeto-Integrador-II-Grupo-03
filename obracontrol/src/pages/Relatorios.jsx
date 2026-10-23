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
import ResponsiveTable from '../components/ResponsiveTable';

const formatarReais = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const resumirObra = (obra) => {
  const orcamento = Number(obra.orcamentoTotal || obra.orcamento || 0);
  const gasto = obra.materiais_utilizados
    ? obra.materiais_utilizados.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0)
    : 0;
  return { orcamento, gasto, saldo: orcamento - gasto };
};

const colunasObras = [
  {
    key: 'nome',
    header: 'Obra',
    primary: true,
    textClassName: 'font-bold text-white',
    render: (obra) => obra.nome
  },
  {
    key: 'status',
    header: 'Status',
    badge: true,
    render: (obra) => (
      <span className="inline-block whitespace-nowrap px-3 py-1 bg-[#1B1F3B] border border-[#2A2F55] rounded-full text-xs font-medium text-[#8F9BB3]">
        {obra.status || 'Em Andamento'}
      </span>
    )
  },
  {
    key: 'orcamento',
    header: 'Orçamento',
    textClassName: 'font-bold text-white',
    render: (obra) => formatarReais(resumirObra(obra).orcamento)
  },
  {
    key: 'gasto',
    header: 'Total Gasto',
    textClassName: 'font-bold text-red-400',
    render: (obra) => formatarReais(resumirObra(obra).gasto)
  },
  {
    key: 'saldo',
    header: 'Saldo / Diferença',
    textClassName: 'font-bold',
    render: (obra) => {
      const { saldo } = resumirObra(obra);
      return <span className={saldo >= 0 ? 'text-green-400' : 'text-red-400'}>{formatarReais(saldo)}</span>;
    }
  }
];

const acoesObra = (obra) => [
  {
    label: 'Ver Obra',
    icon: Eye,
    variant: 'info',
    onClick: () => { window.location.href = `/obra/${obra.id}`; }
  }
];

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

  // Obras filtradas conforme o dropdown
  const obrasFiltradas = obraSelecionada === 'TODAS' 
    ? obras 
    : obras.filter(o => o.id === obraSelecionada || o.nome === obraSelecionada);

  const obraSelecionadaObj = obras.find(o => o.id === obraSelecionada);

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

  // --- FILTRAGEM DINÂMICA DE MOVIMENTAÇÕES CONFORME A ESCOLHA DA OBRA ---
  const movimentacoesFiltradasGrafico = obraSelecionada === 'TODAS'
    ? movimentacoes
    : movimentacoes.filter(m => {
        const desc = (m.descricao || '').toLowerCase();
        const nomeObraMatch = obraSelecionadaObj && obraSelecionadaObj.nome ? desc.includes(obraSelecionadaObj.nome.toLowerCase()) : false;
        const moduloMatch = m.modulo === 'Obras' || m.modulo?.includes('Estoque -> Obra');
        return nomeObraMatch || moduloMatch;
      });

  const totalEntradas = obraSelecionada === 'TODAS' 
    ? movimentacoes.filter(m => m.tipo === 'ENTRADA').length
    : movimentacoesFiltradasGrafico.filter(m => m.tipo === 'ENTRADA' || m.tipo === 'CRIACAO').length;

  const totalSaidas = obraSelecionada === 'TODAS'
    ? movimentacoes.filter(m => m.tipo === 'SAIDA' || m.tipo === 'EDICAO' || m.modulo === 'Obras').length
    : movimentacoesFiltradasGrafico.filter(m => m.tipo === 'SAIDA' || m.tipo === 'EDICAO' || m.tipo === 'EXCLUSAO' || m.modulo === 'Obras').length;

  // Cálculo proporcional para as barras do gráfico
  const maxMov = Math.max(totalEntradas, totalSaidas, 1);
  const alturaEntradasPct = Math.max(30, (totalEntradas / maxMov) * 100);
  const alturaSaidasPct = Math.max(30, (totalSaidas / maxMov) * 100);

  // --- EXPORTAR EXCEL MELHORADO ---
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Executivo
    const resumoData = [
      ["RELATÓRIO EXECUTIVO - GESTÃO DE OBRAS E ESTOQUE"],
      ["Filtro Aplicado:", obraSelecionada === 'TODAS' ? "Todas as Obras" : (obraSelecionadaObj?.nome || 'Obra Específica')],
      ["Data de Emissão:", new Date().toLocaleDateString('pt-BR')],
      [""],
      ["Métrica Financeira / Operacional", "Valor"],
      ["Total de Obras Selecionadas", obrasFiltradas.length],
      ["Orçamento Total Previsto (R$)", totalOrcado],
      ["Total Gasto em Materiais (R$)", totalGastoObras],
      ["Saldo Restante / Diferença (R$)", totalOrcado - totalGastoObras],
      ["Total de Itens no Estoque Geral", totalItensEstoque],
      ["Valor Imobilizado no Estoque (R$)", valorTotalEstoque]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo Executivo");

    // Aba 2: Obras e Materiais Detalhados
    const obrasData = [];
    obrasFiltradas.forEach(o => {
      if (o.materiais_utilizados && o.materiais_utilizados.length > 0) {
        o.materiais_utilizados.forEach(m => {
          obrasData.push({
            "Nome da Obra": o.nome || 'N/D',
            "Status": o.status || 'Em Andamento',
            "Localização": o.local || 'N/D',
            "Material Utilizado": m.nome || 'N/D',
            "Fornecedor": m.fornecedor || 'Não informado',
            "Quantidade Alocada": m.quantidade || 0,
            "Valor Unitário (R$)": m.valorUnitario || 0,
            "Valor Total do Material (R$)": m.valorTotal || 0
          });
        });
      } else {
        obrasData.push({
          "Nome da Obra": o.nome || 'N/D',
          "Status": o.status || 'Em Andamento',
          "Localização": o.local || 'N/D',
          "Material Utilizado": "Nenhum material registado",
          "Fornecedor": "-",
          "Quantidade Alocada": 0,
          "Valor Unitário (R$)": 0,
          "Valor Total do Material (R$)": 0
        });
      }
    });
    const wsObras = XLSX.utils.json_to_sheet(obrasData);
    wsObras['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsObras, "Obras e Materiais");

    // Aba 3: Estoque Geral
    const estoqueData = estoque.map(e => ({
      "Nome do Material": e.nome || 'N/D',
      "Fornecedor": e.fornecedor || 'Não informado',
      "Quantidade em Estoque": e.quantidade || 0,
      "Valor Unitário (R$)": e.valorUnitario || 0,
      "Valor Total em Estoque (R$)": e.valorTotal || (Number(e.quantidade || 0) * Number(e.valorUnitario || 0))
    }));
    const wsEstoque = XLSX.utils.json_to_sheet(estoqueData);
    wsEstoque['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsEstoque, "Estoque Geral");

    XLSX.writeFile(wb, `Relatorio_Completo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- EXPORTAR PDF MELHORADO COM GRÁFICO E TABELAS ---
  const exportarPDF = () => {
    const doc = new jsPDF();
    const nomeFiltro = obraSelecionada === 'TODAS' ? 'Todas as Obras' : (obraSelecionadaObj?.nome || 'Obra Específica');

    // Cabeçalho do PDF
    doc.setFontSize(20);
    doc.setTextColor(11, 14, 38);
    doc.text("Relatório Executivo de Obras e Estoque", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Filtro: ${nomeFiltro} | Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 25);

    // Tabela de Resumo Consolidado
    autoTable(doc, {
      startY: 32,
      head: [['Indicador / Métrica Consolidada', 'Valor']],
      body: [
        ['Obras Analisadas', obrasFiltradas.length],
        ['Orçamento Total Previsto', `R$ ${totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total Gasto em Materiais', `R$ ${totalGastoObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Saldo Estimado / Diferença', `R$ ${(totalOrcado - totalGastoObras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Imobilizado (Estoque)', `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Movimentações Registradas (Entradas / Saídas)', `${totalEntradas} entradas | ${totalSaidas} saídas`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [17, 21, 53], textColor: [255, 202, 24] }
    });

    // Tabela de Obras Detalhadas
    const bodyObras = [];
    obrasFiltradas.forEach(o => {
      const gasto = o.materiais_utilizados ? o.materiais_utilizados.reduce((acc, m) => acc + (Number(m.valorTotal) || 0), 0) : 0;
      const orc = Number(o.orcamentoTotal || o.orcamento || 0);
      bodyObras.push([
        o.nome || 'N/D',
        o.status || 'Em Andamento',
        o.local || 'N/D',
        `R$ ${orc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(orc - gasto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Nome da Obra', 'Status', 'Localização', 'Orçamento', 'Gasto Real', 'Saldo']],
      body: bodyObras,
      theme: 'grid',
      headStyles: { fillColor: [255, 202, 24], textColor: [11, 14, 38] }
    });

    // Tabela de Materiais Utilizados nas Obras Selecionadas
    const bodyMateriais = [];
    obrasFiltradas.forEach(o => {
      if (o.materiais_utilizados && o.materiais_utilizados.length > 0) {
        o.materiais_utilizados.forEach(m => {
          bodyMateriais.push([
            o.nome,
            m.nome || 'N/D',
            m.fornecedor || 'Não informado',
            m.quantidade || 0,
            `R$ ${Number(m.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          ]);
        });
      }
    });

    if (bodyMateriais.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 12,
        head: [['Obra', 'Material', 'Fornecedor', 'Qtd', 'Valor Total']],
        body: bodyMateriais,
        theme: 'grid',
        headStyles: { fillColor: [43, 139, 246], textColor: [255, 255, 255] }
      });
    }

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
    <div className="flex-1 bg-[#0B0E26] p-4 sm:p-6 md:p-8 text-white transition-colors duration-200 min-w-0">
      
      {/* BLOCO TOPO: Título e Botões */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileText size={26} className="text-[#FFCA18]" /> RELATÓRIOS
          </h1>
          <p className="text-xs sm:text-sm text-[#8F9BB3] mt-1">Indicadores financeiros, controlo de estoque e fechamento de obras</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center w-full xl:w-auto">
          {/* Select de Filtro por Obra */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F9BB3]" size={16} />
            <select 
              value={obraSelecionada} 
              onChange={(e) => setObraSelecionada(e.target.value)}
              className="w-full pl-10 pr-6 py-2.5 bg-[#111535] border border-[#2A2F55] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#FFCA18] appearance-none shadow-lg cursor-pointer transition-colors"
            >
              <option value="TODAS">Todas as Obras (Geral)</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          
          {/* Botões de Exportação */}
          <button 
            onClick={exportarPDF}
            className="flex-1 sm:flex-initial justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <FileDown size={16} /> EXPORTAR PDF
          </button>
          <button 
            onClick={exportarExcel}
            className="flex-1 sm:flex-initial justify-center bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/20 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <FileDown size={16} /> EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

      {/* ÁREA DOS GRÁFICOS (DINÂMICOS POR OBRA SELECIONADA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico 1: Movimentações Dinâmico */}
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#2B8BF6]" /> Gráfico Entradas vs Saídas
            </span>
            <span className="text-[10px] bg-[#1B1F3B] px-2.5 py-1 rounded-lg border border-[#2A2F55] text-[#FFCA18]">
              {obraSelecionada === 'TODAS' ? 'Visão Global' : `Filtro: ${obraSelecionadaObj?.nome || 'Obra'}`}
            </span>
          </h3>
          <div className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl flex-1 min-h-[280px] p-6 flex flex-col justify-end">
            <div className="flex justify-around items-end h-48 gap-16 border-b border-[#2A2F55] pb-3 relative">
              
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
            <p className="text-center mt-4 text-[11px] text-[#8F9BB3]">Atualizado em tempo real conforme a obra selecionada</p>
          </div>
        </div>

        {/* Gráfico 2: Orçamento vs Gasto */}
        <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PieChart size={18} className="text-[#FFCA18]" /> Orçamento vs Gasto Real
            </span>
            <span className="text-[10px] bg-[#1B1F3B] px-2.5 py-1 rounded-lg border border-[#2A2F55] text-[#FFCA18]">
              {obraSelecionada === 'TODAS' ? 'Visão Global' : `Filtro: ${obraSelecionadaObj?.nome || 'Obra'}`}
            </span>
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
              <span className="text-[#8F9BB3]">Saldo Restante:</span>
              <span className={totalOrcado - totalGastoObras >= 0 ? "text-green-400" : "text-red-400"}>
                R$ {(totalOrcado - totalGastoObras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* TABELA DE FECHAMENTO DE OBRAS */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-[#2A2F55] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderArchive size={22} className="text-green-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Fechamento e Resumo de Obras</h2>
          </div>
          <span className="text-xs text-[#8F9BB3]">
            {obrasFiltradas.length} {obrasFiltradas.length === 1 ? 'obra exibida' : 'obras exibidas'}
          </span>
        </div>
        
        <ResponsiveTable
          columns={colunasObras}
          data={obrasFiltradas}
          actions={acoesObra}
          cardCols={3}
          emptyMessage="Nenhuma obra encontrada com o filtro selecionado."
        />
      </div>

    </div>
  );
}