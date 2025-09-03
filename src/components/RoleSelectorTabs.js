// src/components/RoleSelectorTabs.js
import React, { useState } from 'react';
import './RoleSelectorTabs.css'; // Creamos el archivo CSS para este componente
import { colors } from '../colors'; // Importamos los colores

function RoleSelectorTabs({ onRoleSelect }) {
  const [activeRole, setActiveRole] = useState('gestora'); // Estado para la pestaña activa

  const handleRoleClick = (role) => {
    setActiveRole(role);
    onRoleSelect(role); // Llama a la función que recibe del componente padre
  };

  return (
    <div className="role-tabs-container">
      <button
        className={`role-tab ${activeRole === 'gestora' ? 'active' : ''}`}
        onClick={() => handleRoleClick('gestora')}
        style={{
          color: activeRole === 'gestora' ? colors.primary : '#555',
          borderBottomColor: activeRole === 'gestora' ? colors.primary : 'transparent',
        }}
      >
        Gestora
      </button>
      <button
        className={`role-tab ${activeRole === 'consultor' ? 'active' : ''}`}
        onClick={() => handleRoleClick('consultor')}
         style={{
          color: activeRole === 'consultor' ? colors.primary : '#555',
          borderBottomColor: activeRole === 'consultor' ? colors.primary : 'transparent',
        }}
      >
        Consultor
      </button>
      <button
        className={`role-tab ${activeRole === 'reclutador' ? 'active' : ''}`}
        onClick={() => handleRoleClick('reclutador')}
         style={{
          color: activeRole === 'reclutador' ? colors.primary : '#555',
          borderBottomColor: activeRole === 'reclutador' ? colors.primary : 'transparent',
        }}
      >
        Reclutador
      </button>
    </div>
  );
}

export default RoleSelectorTabs;