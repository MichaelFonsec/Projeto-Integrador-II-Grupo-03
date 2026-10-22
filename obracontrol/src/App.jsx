import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Movimentacoes from './pages/Movimentacoes';
import Relatorios from './pages/Relatorios';
import Empresas from './pages/Empresas';
import Categorias from './pages/Categorias';
import NovaObra from './pages/NovaObra';
import Obra from './pages/Obra';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota pública de Login */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas dentro do Layout principal */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="movimentacoes" element={<Movimentacoes />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="empresas" element={<Empresas />} />
              <Route path="categorias" element={<Categorias />} />
              <Route path="nova-obra" element={<NovaObra />} />
              <Route path="obra/:id?" element={<Obra />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}