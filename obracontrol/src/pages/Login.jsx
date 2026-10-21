import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { HardHat, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError("As palavras-passe não coincidem.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'usuarios', user.uid), {
          nome: nome,
          email: email,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      } else {
        setError("Falha na autenticação. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0E26] font-sans">
      
      {/* BARRA LATERAL (Perfeitamente alinhada e sem caixas extra) */}
      <aside className="hidden md:flex w-[260px] bg-[#0B0E26] border-r border-[#1B1F3B] flex-col pt-12 pl-8 h-screen select-none z-10">
        <div className="flex items-center gap-2">
          <HardHat className="text-[#FFCA18]" size={28} />
          <h2 className="text-xl font-bold tracking-widest text-[#FFCA18]">
            OBRACONTROL
          </h2>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Alinhada no topo com a barra lateral) */}
      <div className="flex-1 flex flex-col pt-12 px-8 sm:px-12 overflow-y-auto">

        {/* Título nivelado com o logótipo */}
        <h1 className="text-lg font-bold tracking-wider mb-8 text-white uppercase">
          Acesso ao Sistema
        </h1>

        <div className="flex-1 bg-gradient-to-br from-[#111535] to-[#0B0E26] rounded-t-3xl border border-[#1B1F3B] border-b-0 flex items-center justify-center p-4 sm:p-8 min-h-[550px] shadow-2xl relative">
          
          {/* Efeito visual subtil de fundo (Glow) para modernizar */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1D8A52] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>

          {/* CARD DE AUTENTICAÇÃO */}
          <div className="w-full max-w-md bg-[#1B1F3B] border border-[#2A2F55] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col relative z-10">
            
            {/* Abas Alternadoras: Entrar / Cadastrar */}
            <div className="flex bg-[#111535] p-1.5 rounded-xl mb-8 self-center gap-1 w-full max-w-[280px]">
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 ${!isRegister ? 'bg-[#FFCA18] text-[#0B0E26] shadow-[0_0_15px_rgba(255,202,24,0.3)]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#1B1F3B]'}`}
              >
                Entrar
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 ${isRegister ? 'bg-[#FFCA18] text-[#0B0E26] shadow-[0_0_15px_rgba(255,202,24,0.3)]' : 'text-[#8F9BB3] hover:text-white hover:bg-[#1B1F3B]'}`}
              >
                Cadastrar
              </button>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              
              {/* Campo Nome (Apenas ao Cadastrar) */}
              {isRegister && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-[#8F9BB3] uppercase tracking-wider mb-2">Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5578] group-focus-within:text-[#FFCA18] transition-colors" size={18} />
                    <input 
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#141833] border border-[#2A2F55] rounded-xl text-sm text-white placeholder-[#4A5578] focus:outline-none focus:border-[#FFCA18]/50 focus:ring-2 focus:ring-[#FFCA18]/20 transition-all"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Campo E-mail */}
              <div>
                <label className="block text-xs font-bold text-[#8F9BB3] uppercase tracking-wider mb-2">E-Mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5578] group-focus-within:text-[#FFCA18] transition-colors" size={18} />
                  <input 
                    type="email"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#141833] border border-[#2A2F55] rounded-xl text-sm text-white placeholder-[#4A5578] focus:outline-none focus:border-[#FFCA18]/50 focus:ring-2 focus:ring-[#FFCA18]/20 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              {/* Senhas */}
              <div className={isRegister ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'flex flex-col'}>
                <div>
                  <label className="block text-xs font-bold text-[#8F9BB3] uppercase tracking-wider mb-2">Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5578] group-focus-within:text-[#FFCA18] transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-11 pr-12 py-3.5 bg-[#141833] border border-[#2A2F55] rounded-xl text-sm text-white placeholder-[#4A5578] focus:outline-none focus:border-[#FFCA18]/50 focus:ring-2 focus:ring-[#FFCA18]/20 transition-all"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A5578] hover:text-[#8F9BB3] transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-[#8F9BB3] uppercase tracking-wider mb-2">Confirmar</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5578] group-focus-within:text-[#FFCA18] transition-colors" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#141833] border border-[#2A2F55] rounded-xl text-sm text-white placeholder-[#4A5578] focus:outline-none focus:border-[#FFCA18]/50 focus:ring-2 focus:ring-[#FFCA18]/20 transition-all"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1D8A52] hover:bg-[#156d3f] active:scale-[0.98] text-white font-bold py-4 rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(29,138,82,0.3)] mt-6 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>A AGUARDAR...</span>
                  </>
                ) : (
                  <span>{isRegister ? "CRIAR CONTA" : "ENTRAR NO SISTEMA"}</span>
                )}
              </button>

            </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}