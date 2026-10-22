import React, { useState, useEffect } from 'react';
import { History, Search, ArrowDownLeft, ArrowUpRight, Edit, Trash2, User, Clock, Filter, PlusCircle } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico de Movimentações</h1>
          <p className="text-[#8F9BB3]">Auditoria de entradas, saídas e alterações no sistema.</p>
        </div>
      </div>

      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-lg">
        
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou nome do usuário..." 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 md:border-l border-[#2A2F55] pt-4 md:pt-0 md:pl-4">
          <Filter size={18} className="text-[#8F9BB3]" />
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none cursor-pointer"
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
        <div className="p-6 border-b border-[#2A2F55] flex items-center gap-3">
          <History className="text-[#FFCA18]" size={24} />
          <h2 className="text-lg font-bold text-white">Registro de Atividades</h2>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-[#8F9BB3]">Carregando histórico...</div>
        ) : movimentacoesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[#1B1F3B] text-[#8F9BB3]">
                <tr>
                  <th className="px-6 py-4 font-bold w-48">Data e Hora</th>
                  <th className="px-6 py-4 font-bold w-32">Módulo</th>
                  <th className="px-6 py-4 font-bold w-40">Tipo</th>
                  <th className="px-6 py-4 font-bold">Descrição da Ação</th>
                  <th className="px-6 py-4 font-bold w-48">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F55]">
                {movimentacoesFiltradas.map((mov) => {
                  const config = getTipoConfig(mov.tipo);
                  
                  return (
                    <tr key={mov.id} className="hover:bg-[#1B1F3B]/50 transition-colors">
                      <td className="px-6 py-4 text-[#8F9BB3]">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          {formatarData(mov.data)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 font-medium text-white">
                        {mov.modulo}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${config.corFundo} ${config.corTexto}`}>
                          {config.icone} {mov.tipo}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-white">
                        {mov.descricao}
                      </td>
                      
                      <td className="px-6 py-4 text-[#8F9BB3]">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span className="truncate max-w-[150px] font-medium text-white" title={mov.usuario}>
                            {mov.usuario}
                            {nomeUsuarioLogado === mov.usuario && <span className="text-[#FFCA18] text-xs ml-1">(Você)</span>}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-[#8F9BB3]">Nenhum registro encontrado.</div>
        )}
      </div>

    </div>
  );
}