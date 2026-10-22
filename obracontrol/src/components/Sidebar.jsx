import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // <-- Integrado
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { HardHat, LayoutDashboard, Package, ArrowRightLeft, FileText, Building2, Power, Sun, Moon } from 'lucide-react'; // <-- Ícones adicionados

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme(); // <-- Contexto de tema ativado
  
  // Estado para armazenar o nome vindo do Firestore
  const [nomeExibicao, setNomeExibicao] = useState('Carregando...');

  useEffect(() => {
    const buscarNomeUsuario = async () => {
      if (currentUser?.uid) {
        try {
          const docRef = doc(db, 'usuarios', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setNomeExibicao(docSnap.data().nome || 'Usuário');
          } else {
            setNomeExibicao('Usuário');
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setNomeExibicao('Usuário');
        }
      }
    };

    buscarNomeUsuario();
  }, [currentUser]);

  const checkActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <aside className="w-[260px] bg-[#0B0E26] border-r border-[#1B1F3B] flex flex-col h-screen select-none shrink-0 transition-colors duration-200">
      {/* Logótipo */}
      <div className="flex items-center gap-3 pt-8 pb-10 px-6">
        <HardHat className="text-[#FFCA18]" size={28} />
        <h2 className="text-xl font-bold tracking-widest text-[#FFCA18]">OBRACONTROL</h2>
      </div>
      
      {/* Menu de Navegação */}
      <nav className="flex-1 flex flex-col px-4 gap-6 overflow-y-auto">
        
        <div>
          <span className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest px-2 mb-3 block">Navegação</span>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => navigate('/')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/') ? 'bg-[#FFCA18] text-[#0B0E26] shadow-[0_0_15px_rgba(255,202,24,0.15)]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
            >
              <LayoutDashboard size={18} /> Obras
            </button>
            <button 
              onClick={() => navigate('/estoque')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/estoque') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
            >
              <Package size={18} /> Estoque Geral
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest px-2 mb-3 block">Registros</span>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => navigate('/movimentacoes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/movimentacoes') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
            >
              <ArrowRightLeft size={18} /> Movimentações
            </button>
            
            <button 
              onClick={() => navigate('/relatorios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/relatorios') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
            >
              <FileText size={18} /> Relatórios
            </button>

            <button 
              onClick={() => navigate('/empresas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/empresas') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
            >
              <Building2 size={18} /> Fornecedores
            </button>
          </div>
        </div>
      </nav>

      {/* Perfil do Utilizador na Base */}
      <div className="p-4">
        <div className="bg-[#111535] rounded-2xl p-3 flex items-center gap-3 border border-[#2A2F55] transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#FFCA18] text-[#0B0E26] flex items-center justify-center font-bold text-lg shrink-0">
            {nomeExibicao.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{nomeExibicao}</p>
            <p className="text-xs text-[#4A5578]">Administrador</p>
          </div>

          {/* Botão de Alternância Claro/Escuro */}
          <button 
            type="button"
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            className="text-[#4A5578] hover:text-[#FFCA18] transition-colors p-1"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Botão de Logout */}
          <button 
            onClick={handleLogout} 
            title="Terminar sessão" 
            className="text-[#4A5578] hover:text-red-500 transition-colors p-1"
          >
            <Power size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}