import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Building2, Search, Plus, Trash2 } from 'lucide-react';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchEmpresas = async () => {
    const querySnapshot = await getDocs(collection(db, 'empresas'));
    setEmpresas(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchEmpresas(); }, []);

  const buscarCnpj = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;
    
    setLoadingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (response.ok) {
        const data = await response.json();
        setRazaoSocial(data.razao_social);
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
      setCnpj(''); setRazaoSocial('');
      await fetchEmpresas();
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

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-white uppercase tracking-wider mb-8">Fornecedores</h1>
      
      {/* Formulário de Cadastro */}
      <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] mb-8">
        <form onSubmit={handleAddEmpresa} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest mb-2 block">CNPJ (Apenas números)</label>
            <input 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFCA18]/50 focus:ring-1 focus:ring-[#FFCA18]/50" 
              value={cnpj} 
              onChange={e => setCnpj(e.target.value)} 
              onBlur={buscarCnpj}
              maxLength="14"
              placeholder="Digite o CNPJ..."
              required 
            />
          </div>
          <div className="flex-[2] min-w-[250px]">
            <label className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest mb-2 flex items-center gap-2">
              Razão Social
              {loadingCnpj && <span className="text-[#FFCA18] flex items-center gap-1"><Search size={12} className="animate-spin" /> Buscando...</span>}
            </label>
            <input 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFCA18]/50 focus:ring-1 focus:ring-[#FFCA18]/50" 
              value={razaoSocial} 
              onChange={e => setRazaoSocial(e.target.value)} 
              placeholder="Razão Social preenchida automaticamente" 
              required 
            />
          </div>
          <button type="submit" disabled={loadingAction} className="bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] font-bold text-sm py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 h-[46px]">
            <Plus size={18} /> CADASTRAR
          </button>
        </form>
      </div>

      {/* Lista de Fornecedores */}
      <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 pl-2">Empresa / Razão Social</th>
              <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3">CNPJ</th>
              <th className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest border-b border-[#2A2F55] pb-3 text-right pr-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.id} className="group hover:bg-[#1B1F3B] transition-colors">
                <td className="py-4 pl-2 border-b border-[#2A2F55] group-last:border-0 text-sm font-bold text-white flex items-center gap-3">
                  <div className="bg-[#1B1F3B] p-2 rounded-lg border border-[#2A2F55]"><Building2 size={16} className="text-[#8F9BB3]" /></div>
                  {emp.razaoSocial}
                </td>
                <td className="py-4 border-b border-[#2A2F55] group-last:border-0 text-sm text-[#8F9BB3] font-mono">{emp.cnpj}</td>
                <td className="py-4 pr-2 border-b border-[#2A2F55] group-last:border-0 text-right">
                  <button onClick={() => handleDelete(emp.id)} className="text-[#4A5578] hover:text-[#E53E3E] transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr><td colSpan="3" className="py-8 text-center text-[#4A5578] text-sm">Nenhum fornecedor cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}