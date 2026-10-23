import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Building2, Search, Plus, Trash2 } from 'lucide-react';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'empresas'));
      setEmpresas(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'empresas'));
        if (ativo) {
          setEmpresas(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error("Erro ao carregar empresas:", error);
      } finally {
        if (ativo) setLoading(false);
      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const formatarCnpj = (valor) => {
    if (!valor) return '';
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length <= 2) return limpo;
    if (limpo.length <= 5) return `${limpo.slice(0, 2)}.${limpo.slice(2)}`;
    if (limpo.length <= 8) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5)}`;
    if (limpo.length <= 12) return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8)}`;
    return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12, 14)}`;
  };

  const handleCnpjChange = (e) => {
    setCnpj(formatarCnpj(e.target.value));
  };

  const buscarCnpj = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;
    
    setLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (response.ok) {
        const data = await response.json();
        setRazaoSocial(data.razao_social || data.nome_fantasia || '');
      } else {
        alert("CNPJ não encontrado na base de dados.");
      }
    } catch (error) {
      console.error("Erro na busca da BrasilAPI:", error);
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleAddEmpresa = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await addDoc(collection(db, 'empresas'), { cnpj, razaoSocial });
      setCnpj('');
      setRazaoSocial('');
      await fetchEmpresas();
    } catch (error) {
      console.error("Erro ao adicionar empresa:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remover este fornecedor?")) {
      await deleteDoc(doc(db, 'empresas', id));
      fetchEmpresas();
    }
  };

  const empresasFiltradas = empresas.filter(emp => {
    const nome = (emp.razaoSocial || '').toLowerCase();
    const docNum = (emp.cnpj || '').replace(/\D/g, '');
    const busca = termoBusca.toLowerCase().trim();
    const buscaLimpa = busca.replace(/\D/g, '');

    return nome.includes(busca) || (buscaLimpa && docNum.includes(buscaLimpa));
  });

  const colunasEmpresas = [
    {
      key: 'razaoSocial',
      header: 'Empresa / Razão Social',
      primary: true,
      textClassName: 'font-bold text-white',
      render: (emp) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-[#1B1F3B] p-2 rounded-lg border border-[#2A2F55] shrink-0">
            <Building2 size={16} className="text-[#8F9BB3]" />
          </div>
          <span className="min-w-0 break-words">{emp.razaoSocial}</span>
        </div>
      )
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      textClassName: 'text-[#8F9BB3] font-mono',
      render: (emp) => formatarCnpj(emp.cnpj) || '-'
    }
  ];

  const acoesEmpresas = (emp) => [
    { label: 'Remover', icon: Trash2, variant: 'danger', iconOnly: true, onClick: () => handleDelete(emp.id) }
  ];

  return (
    <div className="flex-1 bg-[#0B0E26] p-4 sm:p-6 md:p-8 text-white transition-colors duration-200 min-w-0">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Fornecedores & Empresas</h1>
          <p className="text-sm sm:text-base text-[#8F9BB3]">Cadastre e gerencie fornecedores e parceiros comerciais.</p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4 w-full md:w-auto">
          <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 shadow-lg flex-1 sm:flex-initial">
            <div className="bg-[#FFCA18]/10 p-2 rounded-lg text-[#FFCA18] shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-xs text-[#8F9BB3] uppercase tracking-wider font-semibold">Total Cadastrado</p>
              <p className="text-lg sm:text-xl font-bold text-white">{empresas.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulário de Cadastro */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <Plus className="text-[#FFCA18]" size={22} />
          <h2 className="text-base sm:text-lg font-bold text-white">Cadastrar Novo Fornecedor</h2>
        </div>

        <form onSubmit={handleAddEmpresa} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch md:items-end">
          <div className="md:col-span-4">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">
              CNPJ
              {loadingCnpj && (
                <span className="text-[#FFCA18] ml-2 inline-flex items-center gap-1 text-xs font-normal">
                  <Search size={12} className="animate-spin" /> Buscando dados...
                </span>
              )}
            </label>
            <input 
              type="text"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none transition-colors" 
              value={cnpj} 
              onChange={handleCnpjChange} 
              onBlur={buscarCnpj}
              maxLength="18"
              placeholder="00.000.000/0000-00"
              required 
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-xs sm:text-sm font-bold text-[#8F9BB3] mb-2 block">Razão Social</label>
            <input 
              type="text"
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-sm text-white focus:border-[#FFCA18] outline-none transition-colors" 
              value={razaoSocial} 
              onChange={e => setRazaoSocial(e.target.value)} 
              placeholder="Razão Social ou Nome Fantasia" 
              required 
            />
          </div>

          <div className="md:col-span-3">
            <button 
              type="submit" 
              disabled={loadingAction} 
              className="w-full px-6 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 h-[48px] shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Plus size={18} /> {loadingAction ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Fornecedores */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#2A2F55] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="text-[#FFCA18]" size={22} />
            <h2 className="text-base sm:text-lg font-bold text-white">Fornecedores Registrados</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar fornecedor ou CNPJ..." 
              value={termoBusca} 
              onChange={(e) => setTermoBusca(e.target.value)} 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#FFCA18] outline-none transition-colors" 
            />
          </div>
        </div>

        <ResponsiveTable
          columns={colunasEmpresas}
          data={empresasFiltradas}
          actions={acoesEmpresas}
          loading={loading}
          loadingMessage="Carregando fornecedores..."
          emptyMessage={termoBusca ? 'Nenhum fornecedor encontrado para a busca.' : 'Nenhum fornecedor cadastrado.'}
        />
      </div>
    </div>
  );
}