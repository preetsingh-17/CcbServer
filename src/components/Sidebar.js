// src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { colors } from '../colors';
import { FaBars, FaTimes } from 'react-icons/fa';

function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Verificar al montar el componente
    handleResize();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Limpiar el event listener al desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/gestora/dashboard', label: 'Dashboard' },
    { path: '/gestora', label: 'Programaciones' },
    { path: '/gestora/eventos', label: 'Eventos' },
    { path: '/gestora/consultores', label: 'Consultores' },
    { path: '/gestora/evidencias', label: 'Evidencias' },
    { path: '/gestora/informe-ccb', label: 'Informe CCB'}
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Botón de hamburguesa para móviles */}
      {isMobile && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}
      
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`} 
        style={{ backgroundColor: colors.secondary }}
      >
        <div className="sidebar-header">
          <h3 style={{ color: 'white' }}>Gestión Eventos</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {navItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  style={{
                    color: location.pathname === item.path ? colors.primary : 'white',
                    backgroundColor: location.pathname === item.path ? colors.complement : 'transparent',
                  }}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  {item.label}
                  {isMobile && <span className="mobile-indicator"></span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Overlay para móviles */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </>
  );
}

export default Sidebar;