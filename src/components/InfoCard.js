// src/components/InfoCard.js
import React from 'react';
import './InfoCard.css'; // CSS para la tarjeta
import { colors } from '../colors'; // Importamos los colores

function InfoCard({ title, value, description, valueColor }) {
  return (
    <div className="info-card">
      <h4 className="info-card-title">{title}</h4>
      {/* Aplicamos el color del valor si se especifica, o el color secundario por defecto */}
      <p className="info-card-value" style={{ color: valueColor || colors.secondary }}>
        {value}
      </p>
      <p className="info-card-description">{description}</p>
    </div>
  );
}

export default InfoCard;