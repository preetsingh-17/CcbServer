import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Ruta corregida para el CSS del sidebar según tu estructura
import '../styles/consultorsidebar.css';
// Importa tu hook de autenticación para el botón de cerrar sesión
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

const ConsultorSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout } = useAuth(); // Usamos el hook useAuth para acceder a la función logout

  // Enlaces de navegación principales
  const navLinks = [
    { name: 'Calendario', path: '/consultor/dashboard' },
    { name: 'Eventos', path: '/consultor/events' },
    { name: 'Pagos', path: '/consultor/payments' },
    { name: 'Mi Perfil', path: '/consultor/profile' }, // <-- Nuevo enlace a la página de perfil
    // Puedes añadir más enlaces principales aquí
  ];

  // Función para manejar el cierre de sesión 
  const handleLogout = () => {
    logout(); // Llama a la función logout de tu contexto
    // La redirección al login se manejará automáticamente si tu contexto
    // y App.js están configurados para ello (al cambiar isAuthenticated a false)
  };

  return (
    // Añadimos la clase 'open' si el sidebar está abierto (solo relevante en móvil)
    <div className={`consultor-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="consultor-sidebar-header">
        {/* Logo o título de la aplicación/sección */}
        <h3>Consultor CCB</h3>
         {/* Botón para cerrar el sidebar en móvil (la 'X') */}
         {/* Solo visible en pantallas pequeñas gracias al CSS */}
        <button className="close-sidebar-button" onClick={toggleSidebar}>
           &times; {/* Símbolo de multiplicación para una 'X' simple */}
        </button>
      </div>
      <nav className="consultor-sidebar-nav">
        <ul>
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={location.pathname === link.path ? 'active' : ''}
                onClick={toggleSidebar} 
              >
                 {/* Aquí puedes añadir iconos si lo deseas, ej: <i className="fas fa-calendar-alt"></i> */}
                {link.name}
              </Link>
            </li>
          ))}
          {/* Botón de cerrar sesión en el sidebar */}
          <li>
             <button onClick={handleLogout} className="sidebar-logout-button">
                Cerrar Sesión
             </button>
          </li>
        </ul>
      </nav>

      {/* La sección de lista de eventos y filtros YA NO VA AQUÍ */}

      {/* Información adicional o pie de página del sidebar */}
      {/* Puedes mostrar el nombre del usuario si lo tienes en el contexto */}
      {/* <div className="consultor-sidebar-footer">
         <p>Usuario: {currentUser?.name || 'Consultor'}</p>
      </div> */}
    </div>
  );
};

export default ConsultorSidebar;
