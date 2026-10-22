import React, { useState, useEffect } from 'react';
import { Plus, FolderKanban, Calendar, MapPin, MoreVertical, LayoutDashboard, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig'; 
import { collection, getDocs, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore'; 
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState(null);

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'obras'));
        const obrasArray = [];
        querySnapshot.forEach((doc) => {
          obrasArray.push({ id: doc.id, ...doc.data() });
        });
        setObras(obrasArray);
      } catch (error) {
        console.error("Erro ao buscar obras:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchObras();
  }, []);

  const handleDeleteObra = async (obraSelecionada) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir a obra "${obraSelecionada.nome}"?\nOs materiais alocados serão devolvidos ao estoque geral.`);
    
    if (confirmacao) {
      try {
        const batch = writeBatch(db);

        const materiais = obraSelecionada.materiais_utilizados || [];
        materiais.forEach((mat) => {
          if (mat.estoqueId) {
            const estoqueRef = doc(db, 'estoque', mat.estoqueId);
            batch.update(estoqueRef, { quantidade: increment(mat.quantidade) });
          }
        });

        const obraRef = doc(db, 'obras', obraSelecionada.id);
        batch.delete(obraRef);

        const logRef = doc(collection(db, 'movimentacoes'));
        batch.set(logRef, {
          tipo: 'EXCLUSAO',
          modulo: 'Obras',
          descricao: `Excluiu a obra: ${obraSelecionada.nome} (Materiais devolvidos ao estoque)`,
          usuario: userData?.usuario || currentUser?.email || 'Usuário Desconhecido',
          data: serverTimestamp()
        });

        await batch.commit();
        
        setObras(obras.filter(obra => obra.id !== obraSelecionada.id));
        setMenuAberto(null);
      } catch (error) {
        console.error("Erro ao excluir obra:", error);
        alert("Erro ao excluir a obra. Verifique o console.");
      }
    } else {
      setMenuAberto(null);
    }
  };

  return (
    <div 
      className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto"
      onClick={() => setMenuAberto(null)} 
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Obras</h1>
          <p className="text-[#8F9BB3]">Acesse as obras antigas ou inicie um novo projeto.</p>
        </div>
        
        <button 
          onClick={() => navigate('/nova-obra')}
          className="bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,202,24,0.15)]"
        >
          <Plus size={20} strokeWidth={3} />
          Nova Obra
        </button>
      </div>

      {loading ? (
        <div className="text-[#8F9BB3] text-center mt-10">Carregando obras...</div>
      ) : obras.length === 0 ? (
        <div className="text-[#8F9BB3] text-center mt-10">Nenhuma obra cadastrada ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {obras.map((obra) => (
            <div 
              key={obra.id} 
              onClick={() => navigate('/obra', { state: { id: obra.id } })}
              className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 hover:border-[#4A5578] transition-colors group flex flex-col cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-[#1B1F3B] rounded-xl flex items-center justify-center text-[#FFCA18]">
                  <FolderKanban size={24} />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(menuAberto === obra.id ? null : obra.id);
                    }} 
                    className={`p-1 rounded-lg transition-colors ${menuAberto === obra.id ? 'bg-[#1B1F3B] text-white' : 'text-[#4A5578] hover:text-white'}`}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {menuAberto === obra.id && (
                    <div className="absolute right-0 mt-2 w-36 bg-[#1B1F3B] border border-[#2A2F55] rounded-xl shadow-xl z-20 overflow-hidden">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteObra(obra);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-[#2A2F55] hover:text-red-300 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} /> Excluir Obra
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FFCA18] transition-colors line-clamp-1">{obra.nome}</h3>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-3 text-sm text-[#8F9BB3]">
                  <MapPin size={16} className="shrink-0" />
                  <span className="truncate">{obra.local}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#8F9BB3]">
                  <Calendar size={16} className="shrink-0" />
                  <span>Início: {obra.data}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-[#2A2F55] mt-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  obra.status === 'Em andamento' ? 'bg-[#FFCA18]/10 text-[#FFCA18]' : 'bg-green-500/10 text-green-400'
                }`}>
                  {obra.status}
                </span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/obra', { state: { id: obra.id } });
                  }} 
                  className="flex items-center gap-2 text-sm font-bold text-[#8F9BB3] hover:text-white transition-colors"
                >
                  <LayoutDashboard size={16} /> Acessar Obra
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}