import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { HardHat, Loader2 } from 'lucide-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Ecrã de carregamento com o tema escuro premium
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E26] gap-4">
        <HardHat className="text-[#FFCA18] animate-bounce" size={48} />
        <div className="flex items-center gap-2 text-[#8F9BB3]">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-bold tracking-widest uppercase">A iniciar sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);