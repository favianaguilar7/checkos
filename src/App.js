import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Login from './Login';
import Ordenar from './Ordenar';
import Comandas from './Comandas';
import Caja from './Caja';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute'; // Importa el componente de ruta protegida
import './App.css';

const App = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <>
      {!isLoginPage && <Header />}
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Rutas protegidas */}
        {['/ordenar', '/comandas', '/caja'].map((path) => (
          <Route 
            key={path}
            path={path} 
            element={
              <ProtectedRoute>
                {path === '/ordenar' && <Ordenar />}
                {path === '/comandas' && <Comandas />}
                {path === '/caja' && <Caja />}
              </ProtectedRoute>
            } 
          />
        ))}
      </Routes>
    </>
  );
};

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
