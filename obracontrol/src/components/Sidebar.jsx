import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { HardHat, LayoutDashboard, Package, ArrowRightLeft, FileText, Building2, Power, Sun, Moon, X } from 'lucide-react';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [nomeExibicao, setNomeExibicao] = useState('Carregando...');
  const prevPathRef = useRef(location.pathname);

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

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (onClose) onClose();
    }
  }, [location.pathname, onClose]);

  const checkActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (onClose) onClose();
    await signOut(auth);
    navigate('/login');
  };

  return (
    <>
      {/* Fundo escuro ao abrir menu no telemóvel */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" 
        />
      )}

      <aside className={`w-72 md:w-[260px] bg-[#0B0E26] border-r border-[#2A2F55] flex flex-col h-screen select-none shrink-0 transition-all duration-300 z-50 fixed md:static inset-y-0 left-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logótipo */}
        <div className="flex items-center justify-between pt-6 pb-8 px-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <HardHat className="text-[#FFCA18] shrink-0" size={26} />
            <h2 className="text-lg font-bold tracking-wider text-[#FFCA18] truncate">OBRACONTROL</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="md:hidden text-[#8F9BB3] hover:text-white p-2 hover:bg-[#111535] rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
            title="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Menu de Navegação */}
        <nav className="flex-1 flex flex-col px-4 gap-6 overflow-y-auto">
          
          <div>
            <span className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest px-2 mb-3 block">Navegação</span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleNavigate('/')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/') ? 'bg-[#FFCA18] text-[#0B0E26] shadow-[0_0_15px_rgba(255,202,24,0.15)]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
              >
                <LayoutDashboard size={18} /> Obras
              </button>
              <button 
                onClick={() => handleNavigate('/estoque')}
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
                onClick={() => handleNavigate('/movimentacoes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/movimentacoes') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
              >
                <ArrowRightLeft size={18} /> Movimentações
              </button>
              
              <button 
                onClick={() => handleNavigate('/relatorios')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${checkActive('/relatorios') ? 'bg-[#FFCA18] text-[#0B0E26]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#111535]'}`}
              >
                <FileText size={18} /> Relatórios
              </button>

              <button 
                onClick={() => handleNavigate('/empresas')}
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
              className="text-[#4A5578] hover:text-[#FFCA18] transition-colors p-1 cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Botão de Logout */}
            <button 
              onClick={handleLogout} 
              title="Terminar sessão" 
              className="text-[#4A5578] hover:text-red-500 transition-colors p-1 cursor-pointer"
            >
              <Power size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}