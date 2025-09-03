import React from 'react';
import './EventModal.css';

const EventModal = ({ event, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2 style={{ color: '#e4022c' }}>{event.title}</h2>
        <div className="event-details">
          <p><strong>Programa:</strong> {event.programa}</p>
          <p><strong>Ruta:</strong> {event.ruta}</p>
          <p><strong>Lugar:</strong> {event.lugar}</p>
          <p><strong>Fecha:</strong> {event.start.toLocaleDateString()}</p>
          <p><strong>Horario:</strong> {event.start.toLocaleTimeString()} - {event.end.toLocaleTimeString()}</p>
          <p><strong>Estado:</strong> {event.estado}</p>
        </div>
        <div className="modal-actions">
          <button className="confirm-button">Confirmar Asistencia</button>
          <button className="evidence-button">Subir Evidencia</button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;