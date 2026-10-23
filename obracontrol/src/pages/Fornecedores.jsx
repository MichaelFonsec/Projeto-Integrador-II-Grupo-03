import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building, PlusCircle, Trash2, Search, Edit, Save, X, 
  MapPin, Phone, Mail, FileText, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';

export default function Fornecedores() {
  const { currentUser, userData } = useAuth();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  const [novoFornecedor, setNovoFornecedor] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    telefone: '',
    email: '',
    endereco: ''
  });

  // Tempo real com onSnapshot do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'fornecedores'), (snapshot) => {
      const lista = [];
      snapshot.forEach(docSnap => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      setFornecedores(lista);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar fornecedores:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função para consultar a BrasilAPI pelo CNPJ
  const consultarCNPJ = async (cnpjInput, isEditingMode = false) => {
    const cnpjLimpo = cnpjInput.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return;

    if (isEditingMode) {
      setBuscandoCnpj(true);
    } else {
      setBuscandoCnpj(true);
    }
    setMensagemErro('');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!response.ok) {
        throw new Error('CNPJ não encontrado ou inválido.');
      }
      const data = await response.json();

      const enderecoFormatado = [
        data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}` : '',
        data.bairro,
        data.municipio ? `${data.municipio} - ${data.uf}` : '',
        data.cep ? `CEP: ${data.cep}` : ''
      ].filter(Boolean).join(' | ');

      if (isEditingMode) {
        setEditFormData(prev => ({
          ...prev,
          razaoSocial: data.razao_social || prev.razaoSocial,
          nomeFantasia: data.nome_fantasia || data.razao_social || prev.nomeFantasia,
          telefone: data.ddd_telefone_1 || prev.telefone,
          email: data.email || prev.email,
          endereco: enderecoFormatado || prev.endereco
        }));
      } else {
        setNovoFornecedor(prev => ({
          ...prev,
          razaoSocial: data.razao_social || '',
          nomeFantasia: data.nome_fantasia || data.razao_social || '',
          telefone: data.ddd_telefone_1 || '',
          email: data.email || '',
          endereco: enderecoFormatado || ''
        }));
      }
    } catch (error) {
      console.error("Erro ao consultar CNPJ:", error);
      setMensagemErro('Não foi possível encontrar os dados deste CNPJ automaticamente.');
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleCnpjChange = (e, isEditingMode = false) => {
    const valor = e.target.value;
    if (isEditingMode) {
      setEditFormData({ ...editFormData, cnpj: valor });
    } else {
      setNovoFornecedor({ ...novoFornecedor, cnpj: valor });
    }

    const valorLimpo = valor.replace(/\D/g, '');
    if (valorLimpo.length === 14) {
      consultarCNPJ(valorLimpo, isEditingMode);
    }
  };

  const handleAddFornecedor = async (e) => {
    e.preventDefault();
    if (!novoFornecedor.cnpj || !novoFornecedor.razaoSocial) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'fornecedores'), {
        ...novoFornecedor,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'movimentacoes'), {
        tipo: 'ENTRADA',
        modulo: 'Fornecedores',
        descricao: `Cadastrou o fornecedor: ${novoFornecedor.nomeFantasia || novoFornecedor.razaoSocial}`,
        usuario: userData?.usuario || currentUser?.email || 'Utilizador',
        data: serverTimestamp()
      });

      setNovoFornecedor({ cnpj: '', razaoSocial: '', nomeFantasia: '', telefone: '', email: '', endereco: '' });
      setMensagemErro('');
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      setMensagemErro('Erro ao guardar fornecedor na base de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFornecedor = async (id, nome) => {
    if (window.confirm(`Tem a certeza que deseja excluir o fornecedor "${nome}"?`)) {
      try {
        await deleteDoc(doc(db, 'fornecedores', id));
        await addDoc(collection(db, 'movimentacoes'), {
          tipo: 'EXCLUSAO',
          modulo: 'Fornecedores',
          descricao: `Excluiu o fornecedor: ${nome}`,
          usuario: userData?.usuario || currentUser?.email || 'Utilizador',
          data: serverTimestamp()
        });
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditFormData({
      cnpj: item.cnpj || '',
      razaoSocial: item.razaoSocial || '',
      nomeFantasia: item.nomeFantasia || '',
      telefone: item.telefone || '',
      email: item.email || '',
      endereco: item.endereco || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const docRef = doc(db, 'fornecedores', id);
      await updateDoc(docRef, editFormData);
      setEditingId(null);

      await addDoc(collection(db, 'movimentacoes'), {
        tipo: 'EDICAO',
        modulo: 'Fornecedores',
        descricao: `Atualizou os dados do fornecedor: ${editFormData.nomeFantasia || editFormData.razaoSocial}`,
        usuario: userData?.usuario || currentUser?.email || 'Utilizador',
        data: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
    }
  };

  const fornecedoresFiltrados = fornecedores.filter(item => 
    (item.razaoSocial || '').toLowerCase().includes(termoBusca.toLowerCase()) || 
    (item.nomeFantasia || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
    (item.cnpj || '').includes(termoBusca)
  );

  return (
    <div className="flex-1 bg-[#0B0E26] min-h-screen p-8 text-white overflow-y-auto transition-colors duration-200">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
            <Building size={26} className="text-[#FFCA18]" /> FORNECEDORES & PARCEIROS
          </h1>
          <p className="text-sm text-[#8F9BB3] mt-1">Registo e consulta automática de fornecedores(CNPJ)</p>
        </div>
        
        <div className="bg-[#111535] border border-[#2A2F55] rounded-xl px-6 py-3 flex items-center gap-4 shadow-lg">
          <div className="bg-[#FFCA18]/10 p-2 rounded-lg text-[#FFCA18]">
            <Building size={24} />
          </div>
          <div>
            <p className="text-xs text-[#8F9BB3] font-bold uppercase tracking-wider">Total de Fornecedores</p>
            <p className="text-xl font-bold text-white">{fornecedores.length}</p>
          </div>
        </div>
      </div>

      {mensagemErro && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle size={20} />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Formulário de Cadastro com Consulta Automática de CNPJ */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl p-6 shadow-xl mb-8">
        <h2 className="text-lg font-bold border-b border-[#2A2F55] pb-3 mb-5 text-[#FFCA18] flex items-center gap-2">
          <PlusCircle size={20} /> Cadastrar Novo Fornecedor (Busca Automática por CNPJ)
        </h2>
        
        <form onSubmit={handleAddFornecedor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block flex items-center justify-between">
                <span>CNPJ (Apenas números)</span>
                {buscandoCnpj && <span className="text-[#FFCA18] flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> A consultar API...</span>}
              </label>
              <input 
                type="text" 
                name="cnpj" 
                maxLength="18"
                placeholder="Ex: 00.000.000/0001-00"
                value={novoFornecedor.cnpj} 
                onChange={(e) => handleCnpjChange(e, false)} 
                required 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block">Razão Social</label>
              <input 
                type="text" 
                name="razaoSocial" 
                placeholder="Preenchido via CNPJ ou manual"
                value={novoFornecedor.razaoSocial} 
                onChange={(e) => setNovoFornecedor({...novoFornecedor, razaoSocial: e.target.value})} 
                required 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block">Nome Fantasia</label>
              <input 
                type="text" 
                name="nomeFantasia" 
                placeholder="Nome comercial"
                value={novoFornecedor.nomeFantasia} 
                onChange={(e) => setNovoFornecedor({...novoFornecedor, nomeFantasia: e.target.value})} 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block">Telefone</label>
              <input 
                type="text" 
                name="telefone" 
                placeholder="(00) 00000-0000"
                value={novoFornecedor.telefone} 
                onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block">E-mail</label>
              <input 
                type="email" 
                name="email" 
                placeholder="contato@fornecedor.com"
                value={novoFornecedor.email} 
                onChange={(e) => setNovoFornecedor({...novoFornecedor, email: e.target.value})} 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#8F9BB3] mb-2 block">Endereço Completo</label>
              <input 
                type="text" 
                name="endereco" 
                placeholder="Rua, Número, Bairro, Cidade - UF"
                value={novoFornecedor.endereco} 
                onChange={(e) => setNovoFornecedor({...novoFornecedor, endereco: e.target.value})} 
                className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl px-4 py-3 text-white focus:border-[#FFCA18] outline-none text-sm" 
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-8 py-3 bg-[#FFCA18] hover:bg-[#e6b616] text-[#0B0E26] rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 text-sm cursor-pointer shadow-lg"
            >
              {isSubmitting ? 'A guardar...' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Fornecedores */}
      <div className="bg-[#111535] border border-[#2A2F55] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#2A2F55] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Building className="text-[#FFCA18]" size={24} />
            <h2 className="text-lg font-bold text-white">Lista de Fornecedores Registados</h2>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F9BB3]" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou CNPJ..." 
              value={termoBusca} 
              onChange={(e) => setTermoBusca(e.target.value)} 
              className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#FFCA18] outline-none" 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-[#8F9BB3]">A carregar fornecedores...</div>
        ) : fornecedoresFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-[#1B1F3B] text-[#8F9BB3]">
                <tr>
                  <th className="px-6 py-4 font-bold">Empresa / Razão Social</th>
                  <th className="px-6 py-4 font-bold">CNPJ</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold">Endereço</th>
                  <th className="px-6 py-4 font-bold text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F55]/50">
                {fornecedoresFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1B1F3B]/50 transition-colors">
                    {editingId === item.id ? (
                      <>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={editFormData.razaoSocial} 
                            onChange={(e) => setEditFormData({...editFormData, razaoSocial: e.target.value})} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs mb-1"
                            placeholder="Razão Social"
                          />
                          <input 
                            type="text" 
                            value={editFormData.nomeFantasia} 
                            onChange={(e) => setEditFormData({...editFormData, nomeFantasia: e.target.value})} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs"
                            placeholder="Nome Fantasia"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={editFormData.cnpj} 
                            onChange={(e) => handleCnpjChange(e, true)} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={editFormData.telefone} 
                            onChange={(e) => setEditFormData({...editFormData, telefone: e.target.value})} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs mb-1"
                            placeholder="Telefone"
                          />
                          <input 
                            type="text" 
                            value={editFormData.email} 
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs"
                            placeholder="E-mail"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={editFormData.endereco} 
                            onChange={(e) => setEditFormData({...editFormData, endereco: e.target.value})} 
                            className="w-full bg-[#0B0E26] border border-[#2A2F55] rounded-lg px-3 py-2 text-white text-xs"
                            placeholder="Endereço"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleSaveEdit(item.id)} className="text-green-400 hover:bg-green-400/10 p-2 rounded-lg cursor-pointer"><Save size={18} /></button>
                            <button onClick={() => setEditingId(null)} className="text-[#8F9BB3] hover:text-white p-2 rounded-lg cursor-pointer"><X size={18} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{item.nomeFantasia || item.razaoSocial}</p>
                          {item.nomeFantasia && <p className="text-xs text-[#8F9BB3] mt-0.5">{item.razaoSocial}</p>}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-[#FFCA18]">{item.cnpj}</td>
                        <td className="px-6 py-4 text-xs text-[#8F9BB3]">
                          <p className="flex items-center gap-1.5"><Phone size={13} /> {item.telefone || 'Não inf.'}</p>
                          <p className="flex items-center gap-1.5 mt-1"><Mail size={13} /> {item.email || 'Não inf.'}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#8F9BB3]">
                          <p className="flex items-center gap-1.5"><MapPin size={13} className="shrink-0" /> {item.endereco || 'Endereço não informado'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEditClick(item)} className="text-[#FFCA18] hover:bg-[#FFCA18]/10 p-2 rounded-lg cursor-pointer" title="Editar"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteFornecedor(item.id, item.nomeFantasia || item.razaoSocial)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg cursor-pointer" title="Excluir"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#8F9BB3]">
            <Building size={40} className="mx-auto mb-3 opacity-30 text-[#FFCA18]" />
            <p className="text-sm">Nenhum fornecedor registado ou encontrado.</p>
          </div>
        )}
      </div>

    </div>
  );
}