import React from 'react';
import './EventItem.css'; // Asegúrate de que esta importación exista

// Importa iconos si los usas (ejemplo con react-icons)
// Asegúrate de tener react-icons instalado (npm install react-icons)
// import { FaEdit, FaTrash } from 'react-icons/fa';

// Componente funcional para mostrar un ítem de evento
function EventItem({ event, onEdit, onDelete }) {
  // event: objeto con los detalles del evento (id, title, date, etc.)
  // onEdit: función a llamar cuando se hace clic en editar, recibe el id del evento
  // onDelete: función a llamar cuando se hace clic en eliminar, recibe el id del evento

  return (
    // Usamos la clase 'event-item' para aplicar estilos
    <div className="event-item">
      {/* Contenedor para la información del evento */}
      <div className="event-item-info">
        {/* Título del evento */}
        <h3>{event.title}</h3>
        {/* Detalles del evento */}
        <p>Fecha: {event.date} | Hora Inicio: {event.time} | Hora Fin: {event.endTime}</p>
        <p>Programa: {event.program}</p>
        <p>Lugar: {event.location} | Modalidad: {event.modality}</p>
        <p>Instructor: {event.instructor}</p>
        <p>Especialidad: {event.specialty}</p>
        {/* Puedes añadir más detalles aquí si son relevantes para mostrar en la lista */}
      </div>

      {/* Contenedor para los botones de acción */}
      <div className="event-item-actions">
        {/* Botón de editar */}
        {/* Llama directamente a la prop onEdit al hacer clic */}
        <button onClick={() => onEdit(event.id)} aria-label="Editar evento" className="edit-button">
           {/* <FaEdit /> */} {/* Icono de editar si usas react-icons */}
           Editar
        </button>
        {/* Botón de eliminar */}
        {/* Llama directamente a la prop onDelete al hacer clic */}
        <button onClick={() => onDelete(event.id)} aria-label="Eliminar evento" className="delete-button">
           {/* <FaTrash /> */} {/* Icono de eliminar si usas react-icons */}
           Eliminar
        </button>
      </div>
    </div>
  );
}

export default EventItem;
