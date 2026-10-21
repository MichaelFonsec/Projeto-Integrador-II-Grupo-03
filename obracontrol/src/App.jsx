import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Estrutura
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Empresas from './pages/Empresas';
import Categorias from './pages/Categorias';
import Movimentacoes from './pages/Movimentacoes';
import Relatorios from './pages/Relatorios'; // <-- IMPORTAÇÃO ADICIONADA AQUI

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota Pública (Não tem menu lateral) */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas Privadas (Têm o Layout com menu lateral) */}
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/Estoque" element={<PrivateRoute><Layout><Estoque /></Layout></PrivateRoute>} />
          <Route path="/empresas" element={<PrivateRoute><Layout><Empresas /></Layout></PrivateRoute>} />
          <Route path="/categorias" element={<PrivateRoute><Layout><Categorias /></Layout></PrivateRoute>} />
          <Route path="/movimentacoes" element={<PrivateRoute><Layout><Movimentacoes /></Layout></PrivateRoute>} />
          
          {/* <-- ROTA DE RELATÓRIOS ADICIONADA AQUI --> */}
          <Route path="/relatorios" element={<PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}