import React, { useState, useEffect } from 'react';
import { History, Search, ArrowDownLeft, ArrowUpRight, Edit, Trash2, User, Clock, Filter, PlusCircle } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Movimentacoes() {
  const { currentUser, userData } = useAuth(); 
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  useEffect(() => {
    const fetchMovimentacoes = async () => {
      try {
        const q = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const historicoArray = [];
        querySnapshot.forEach((doc) => {
          historicoArray.push({ id: doc.id, ...doc.data() });
        });
        
        setMovimentacoes(historicoArray);
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimentacoes();
  }, []);

  const getTipoConfig = (tipo) => {
    switch (tipo) {
      case 'ENTRADA': 
        return { icone: <ArrowDownLeft size={16} />, corTexto: 'text-green-400', corFundo: 'bg-green-500/10' };
      case 'SAIDA': 
        return { icone: <ArrowUpRight size={16} />, corTexto: 'text-red-400', corFundo: 'bg-red-500/10' };
      case 'CRIACAO': 
        return { icone: <PlusCircle size={16} />, corTexto: 'text-blue-400', corFundo: 'bg-blue-500/10' };
      case 'EDICAO': 
        return { icone: <Edit size={16} />, corTexto: 'text-[#FFCA18]', corFundo: 'bg-[#FFCA18]/10' };
      case 'EXCLUSAO': 
        return { icone: <Trash2 size={16} />, corTexto: 'text-gray-400', corFundo: 'bg-gray-500/10' };
      default: 
        return { icone: <History size={16} />, corTexto: 'text-white', corFundo: 'bg-[#1B1F3B]' };
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data desconhecida';
    const dataObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(dataObj);
  };

  const movimentacoesFiltradas = movimentacoes.filter(mov => {
    const textoMatch = mov.descricao.toLowerCase().includes(termoBusca.toLowerCase()) || 
                       (mov.usuario || '').toLowerCase().includes(termoBusca.toLowerCase());
    const tipoMatch = filtroTipo === 'TODOS' || mov.tipo === filtroTipo;
    return textoMatch && tipoMatch;
  });

  const nomeUsuarioLogado = userData?.usuario || currentUser?.email;

  const colunasMovimentacoes = [
    {
      key: 'data',
      header: 'Data e Hora',
      textClassName: 'text-[#8F9BB3]',
      render: (mov) => (
        <div className="flex items-center gap-2">
          <Clock size={14} className="shrink-0" />
          <span>{formatarData(mov.data)}</span>
        </div>
      )
    },
    {
      key: 'modulo',
      header: 'Módulo',
      textClassName: 'font-medium text-white',
      render: (mov) => mov.modulo
    },
    {
      key: 'tipo',
      header: 'Tipo',
      badge: true,
      render: (mov) => {
        const config = getTipoConfig(mov.tipo);
        return (
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold ${config.corFundo} ${config.corTexto}`}>
            {config.icone} {mov.tipo}
          </span>
        );
      }
    },
    {
      key: 'descricao',
      header: 'Descrição da Ação',
      primary: true,
      textClassName: 'text-white',
      render: (mov) => mov.descricao
    },
    {
      key: 'usuario',
      header: 'Usuário',
      textClassName: 'text-[#8F9BB3]',
      render: (mov) => (
        <div className="flex items-center gap-2 min-w-0">
          <User size={14} className="shrink-0" />
          <span className="min-w-0 break-words md:truncate md:max-w-[10rem] font-medium text-white" title={mov.usuario}>
            {mov.usuario}
            {nomeUsuarioLogado === mov.usuario && <span className="text-[#FFCA18] text-xs ml-1">(Você)</span>}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 bg-[#0B0E26] p-4 sm:p-6 md:p-8 text-white transition-colors duration-200 min-w-0">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Histórico de Movimentações</h1>
          <p className="text-sm sm:text-base text-[#8F9BB3]">Auditoria de entradas, saídas e alterações no sistema.</p>
        </div>
      </div>

      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center shadow-lg">
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou nome do usuário..." 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white focus:border-[#FFCA18] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 border-t sm:border-t-0 sm:border-l border-[#2A2F55] pt-3 sm:pt-0 sm:pl-4">
          <Filter size={18} className="text-[#8F9BB3] shrink-0" />
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full sm:w-auto bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-2.5 sm:py-3 text-sm text-white focus:border-[#FFCA18] outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="ENTRADA">Entradas (Estoque)</option>
            <option value="SAIDA">Saídas (Obras)</option>
            <option value="CRIACAO">Criações</option>
            <option value="EDICAO">Edições</option>
            <option value="EXCLUSAO">Exclusões</option>
          </select>
        </div>
      </div>

      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#2A2F55] flex items-center gap-3">
          <History className="text-[#FFCA18]" size={22} />
          <h2 className="text-base sm:text-lg font-bold text-white">Registro de Atividades</h2>
        </div>
        
        <ResponsiveTable
          columns={colunasMovimentacoes}
          data={movimentacoesFiltradas}
          loading={loading}
          loadingMessage="Carregando histórico..."
          emptyMessage="Nenhum registro encontrado."
        />
      </div>

    </div>
  );
}