// src/components/EventRow.js
import React from 'react';
import './EventListPage.css'; // Asegúrate de que este componente también importe el CSS
import { FaPencilAlt, FaTrashAlt, FaMapMarkerAlt } from 'react-icons/fa'; // Iconos

// Componente para mostrar una fila de evento en la tabla (vista de escritorio)
function EventRow({ event, onEdit, onDelete }) {
    // Asegúrate de que event.estadoActividad exista o usa un valor por defecto
    const eventState = event.estadoActividad || 'Programado';

    return (
        // La clase 'table-row' viene de EventListPage.css
        <div className="table-row">
            {/* Celda Evento (Título y Ubicación) */}
            <div className="table-cell event-col" data-label="Evento">
                <div className="event-details">
                    <div className="event-title">{event.title}</div>
                    <div className="event-location">
                         {/* Icono de ubicación */}
                        <FaMapMarkerAlt />
                        <span>{event.location}</span>
                    </div>
                </div>
            </div>

            {/* Celda Fecha y Hora */}
            <div className="table-cell date-time-col" data-label="Fecha y Hora">
                {event.displayDate} <br/> {event.time}
            </div>

            {/* Celda Modalidad */}
            <div className="table-cell modality-col" data-label="Modalidad">
                 {/* Aplicamos la clase de píldora y la clase específica de modalidad */}
                <span className={`modality-pill ${event.modality}`}>{event.modality}</span>
            </div>

            {/* Celda Instructor */}
            <div className="table-cell instructor-col" data-label="Instructor">
                {event.instructor}
            </div>

            {/* Celda Participantes */}
            <div className="table-cell participants-col" data-label="Participantes">
                {event.participants}
            </div>

            {/* Celda Estado */}
             {/* Añadimos la celda de Estado que faltaba en la estructura de tabla */}
             <div className="table-cell status-col" data-label="Estado">
                 {/* Aplicamos la clase de píldora y la clase específica de estado */}
                 <span className={`status-pill ${eventState}`}>{eventState}</span>
             </div>


            {/* Celda Acciones */}
            <div className="table-cell actions-col" data-label="Acciones">
                <div className="action-buttons">
                    {/* Botón Editar */}
                    <button onClick={onEdit} className="action-button edit-button">
                        <FaPencilAlt /> {/* Icono de lápiz */}
                    </button>
                    {/* Botón Eliminar */}
                    <button onClick={onDelete} className="action-button delete-button">
                        <FaTrashAlt /> {/* Icono de papelera */}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventRow;
