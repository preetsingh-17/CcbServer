import React, { useState } from 'react';
import ConsultorSidebar from './ConsultorSidebar'; // Importar el sidebar específico del consultor
// Ruta corregida para el CSS del layout según tu estructura
import '../styles/consultor-layout.css';

const ConsultorLayout = ({ children }) => {
  // Estado para controlar si el sidebar está abierto (para el comportamiento burger en móvil)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Función para alternar el estado del sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="consultor-layout-container">
      {/* Pasamos el estado y la función al Sidebar */}
      <ConsultorSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Área de contenido principal */}
      {/* Añadimos una clase al main para ajustar el margen/padding cuando el sidebar está abierto en móvil */}
      <main className={`consultor-content-area ${isSidebarOpen ? 'sidebar-open' : ''}`}>
         {/* Botón "Burger" para abrir/cerrar el sidebar en pantallas pequeñas */}
         {/* Solo visible en pantallas pequeñas gracias al CSS */}
        <button className="burger-button" onClick={toggleSidebar}>
          &#9776; {/* Símbolo de tres líneas (burger) */}
        </button>

        {/* Aquí se renderizará el contenido de la página (ej: ConsultorDashboardPage) */}
        {children}
      </main>
    </div>
  );
};

export default ConsultorLayout;
