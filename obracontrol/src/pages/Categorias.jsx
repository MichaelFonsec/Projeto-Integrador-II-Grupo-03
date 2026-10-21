import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Tags, Trash2, Plus } from 'lucide-react';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState('');

  const fetchCategorias = async () => {
    const querySnapshot = await getDocs(collection(db, 'categorias'));
    setCategorias(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchCategorias(); }, []);

  const handleAddCategoria = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await addDoc(collection(db, 'categorias'), { nome });
    setNome(''); fetchCategorias();
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="text-xl font-bold text-white uppercase tracking-wider mb-8">Grupos e Categorias</h1>
      
      <div className="bg-[#111535] rounded-2xl p-6 border border-[#2A2F55] mb-8">
        <form onSubmit={handleAddCategoria} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-[#4A5578] uppercase tracking-widest mb-2 block">Nova Categoria</label>
            <input className="w-full bg-[#1B1F3B] border border-[#2A2F55] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFCA18]/50" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Tintas, Hidráulica..." required />
          </div>
          <button type="submit" className="bg-[#2B8BF6] text-white font-bold text-sm py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 h-[46px]">
            <Plus size={18} /> SALVAR
          </button>
        </form>
      </div>

      <div className="bg-[#111535] rounded-2xl border border-[#2A2F55] overflow-hidden">
        {categorias.map(cat => (
          <div key={cat.id} className="flex justify-between items-center p-4 border-b border-[#2A2F55] last:border-0 hover:bg-[#1B1F3B]">
            <div className="flex items-center gap-3">
              <Tags className="text-[#8F9BB3]" size={16} />
              <span className="text-sm font-bold text-white">{cat.nome}</span>
            </div>
            <button onClick={() => deleteDoc(doc(db, 'categorias', cat.id)).then(fetchCategorias)} className="text-[#4A5578] hover:text-[#E53E3E]">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}