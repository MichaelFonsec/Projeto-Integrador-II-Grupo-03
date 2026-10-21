import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  
  // Se existir utilizador logado, mostra a página dentro do Layout. 
  // Se não, envia de volta para a tela de Login.
  return currentUser ? children : <Navigate to="/login" />;
}