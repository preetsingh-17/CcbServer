// src/components/DashboardLayout.js
import React from 'react';
// Importamos useAuth para obtener la información del usuario y la función logout
import { useAuth } from '../context/AuthContext';
// Importamos useNavigate para redirigir después del logout
import { useNavigate } from 'react-router-dom';
// Importamos los colores
import { colors } from '../colors';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

function DashboardLayout({ children }) {
  // Obtenemos el usuario y la función logout del contexto de autenticación
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    logout(); // Llama a la función logout del contexto
    navigate('/login'); // Redirige al usuario a la página de login después de cerrar sesión
  };

  // Obtener el nombre y rol del usuario desde userData
  const userName = userData?.user?.email === 'austate@uniempresarial.edu.co' ? 'Andreina Ustate' : (userData?.user?.nombre || 'Usuario');
  const userRoleDisplay = userData?.user?.rol === 'gestora' ? 'Gestora Administrativa' : 
                         userData?.user?.rol === 'consultor' ? 'Consultor' : 
                         userData?.user?.rol === 'reclutador' ? 'Reclutador' : 'Usuario';

  return (
    <div className="dashboard-layout">
      {/* La barra lateral (Sidebar) */}
      <Sidebar />

      {/* El área de contenido principal */}
      <main className="dashboard-content">
        {/* Encabezado del Dashboard con nombre y botón de logout */}
        <header className="dashboard-header">
          <div className="user-info">
            {/* Avatar con iniciales */}
            <div className="user-avatar">
              {userName !== 'Usuario' ? userName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            {/* Muestra el nombre del usuario y su rol/descripción */}
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRoleDisplay}</span>
            </div>
          </div>
          {/* Botón de Cerrar Sesión */}
          <button className="logout-button" onClick={handleLogout} style={{ backgroundColor: colors.primary }}>
            Cerrar Sesión
          </button>
        </header>

        {/* El contenido específico de la página (Dashboard, Nueva Programación, etc.) se renderiza aquí */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

// Exporta el componente DashboardLayout como la exportación por defecto de este archivo
export default DashboardLayout;
