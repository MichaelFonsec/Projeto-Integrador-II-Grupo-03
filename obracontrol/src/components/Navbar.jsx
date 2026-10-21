import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
    }
  };

  return (
    <header>
      <div>CONSTRUTORA CBR</div>
      <select>
        <option>Selecionar Obra</option>
        <option>Nova Obra</option>
      </select>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span>{currentUser?.email || 'Usuário'}</span>
        <button onClick={handleLogout}>Sair</button>
      </div>
    </header>
  );
}