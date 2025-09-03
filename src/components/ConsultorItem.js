// src/components/ConsultorItem.js
import React from 'react';
import './ConsultorItem.css'; // Importa los estilos para este componente
// Si usas un archivo de colores (ej: src/colors.js) y necesitas usarlos en línea, impórtalo:
// import { colors } from '../colors';

// Componente funcional para mostrar un solo consultor en la lista
// Recibe el objeto 'consultor' y las funciones 'onEdit' y 'onDelete'
function ConsultorItem({ consultor, onEdit, onDelete }) {
    // Extrae las propiedades del objeto consultor. Asegúrate de que tu objeto consultor tenga estas propiedades.
    // Si tus datos mock o reales tienen nombres de propiedades diferentes, ajústalos aquí.
    const { cedula, nombre, especialidad, contacto, eventos } = consultor;


    // Función para obtener las iniciales del nombre para el avatar
    const getInitials = (name) => {
        if (!name) return '';
        const nameParts = name.split(' ').filter(part => part.length > 0); // Filtra partes vacías
        if (nameParts.length > 1) {
            // Toma la primera letra del primer nombre y la primera letra del último nombre (si existe)
            return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        }
        // Si solo hay un nombre o está vacío, toma la primera letra del primer nombre (si existe)
        return nameParts.length > 0 ? nameParts[0][0].toUpperCase() : '';
    };

    // Funciones para manejar los clics en los botones de acción
    // Llaman a las funciones pasadas como props (onEdit, onDelete)
    const handleEditClick = () => {
        if (onEdit) {
            onEdit(cedula); // Llama a la prop onEdit pasando el ID del consultor
        }
    };

    const handleDeleteClick = () => {
       if (onDelete) {
            onDelete(cedula); // Llama a la prop onDelete pasando el ID del consultor
        }
    };

    return (
        // Contenedor principal para cada elemento de la lista de consultores
        // La clase 'consultor-item' usará display: grid en ConsultorItem.css para organizar las columnas
        <div className="consultor-item">
            {/* Columna de Nombre (incluye Avatar/Iniciales) */}
            {/* Asegúrate de que la clase CSS 'name-col' exista en ConsultorItem.css */}
            <div className="item-cell name-col">
                {/* Contenedor para el avatar/iniciales */}
                {/* Asegúrate de que la clase CSS 'consultor-avatar' exista en ConsultorItem.css */}
                {/* El color de fondo del avatar se define en ConsultorItem.css */}
                <div className="consultor-avatar">
                    {getInitials(nombre)} {/* Muestra las iniciales del consultor */}
                </div>
                <span>{nombre}</span> {/* Muestra el nombre completo del consultor */}
            </div>

            {/* Columna de Especialidad */}
            {/* Asegúrate de que la clase CSS 'specialty-col' exista en ConsultorItem.css */}
            <div className="item-cell specialty-col">
                {especialidad} {/* Muestra la especialidad */}
            </div>

            {/* Columna de Contacto */}
            {/* Asegúrate de que la clase CSS 'contact-col' exista en ConsultorItem.css */}
            <div className="item-cell contact-col">
                {/* Muestra el contacto (email y/o teléfono) */}
                {contacto && contacto.email && <div>{contacto.email}</div>}
                {contacto && contacto.telefono && <div>{contacto.telefono}</div>}
            </div>

            {/* Columna de Eventos */}
            {/* Asegúrate de que la clase CSS 'events-col' exista en ConsultorItem.css */}
            <div className="item-cell events-col">
                {/* Muestra la cantidad de eventos, con un estilo similar al badge en la imagen */}
                {/* Asegúrate de que la clase CSS 'event-count-badge' exista en ConsultorItem.css */}
                <span className="event-count-badge">{eventos} eventos</span>
            </div>

            {/* Columna de Acciones (Botones de Editar y Eliminar) */}
            {/* Asegúrate de que la clase CSS 'actions-col' exista en ConsultorItem.css */}
            <div className="item-cell actions-col">
                {/* Botón de Editar */}
                {/* Llama a la función handleEditClick cuando se hace clic */}
                {/* Asegúrate de que las clases CSS 'action-button' y 'edit-button' existan en ConsultorItem.css */}
                <button className="action-button edit-button" onClick={handleEditClick}>
                    Editar
                </button>
                {/* Botón de Eliminar */}
                {/* Llama a la función handleDeleteClick cuando se hace clic */}
                {/* Asegúrate de que las clases CSS 'action-button' y 'delete-button' existan en ConsultorItem.css */}
                <button className="action-button delete-button" onClick={handleDeleteClick}>
                    Eliminar
                </button>
            </div>
        </div>
    );
}

export default ConsultorItem;
