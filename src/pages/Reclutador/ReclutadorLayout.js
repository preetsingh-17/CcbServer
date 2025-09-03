import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ReclutadorLayout.css';

function ReclutadorLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="reclutador-layout">
      <nav className="reclutador-nav">
  <div className="nav-brand">
    <span>Portal de Reclutamiento</span>
  </div>

  <div className="nav-links">
    <NavLink 
      to="/reclutador/vacantes" 
      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
    >
      <i className="fas fa-briefcase"></i>
      Gestión de Vacantes
    </NavLink>

    <NavLink 
      to="/reclutador/postulaciones" 
      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
    >
      <i className="fas fa-users"></i>
      Postulaciones
    </NavLink>
    <div className="nav-footer">
    <button onClick={handleLogout} className="btn-logout">
      <i className="fas fa-sign-out-alt"></i>
      Cerrar Sesión
    </button>
  </div>
  </div>
</nav>
      <main className="reclutador-main">
        <Outlet />
      </main>
    </div>
  );
}

export default ReclutadorLayout; 