// src/pages/Gestora/ConsultorDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './ConsultorDetailPage.css'; // Reusa tu CSS
import apiService from '../../utils/api';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileAlt, FaCalendarAlt, FaClock, FaTrash, FaPencilAlt, FaSave, FaTimes } from 'react-icons/fa';

function ConsultorDetailPage() {
    const { cedula } = useParams();
    const navigate = useNavigate();

    // Estados para datos, carga y errores
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [consultor, setConsultor] = useState(null);
    const [assignedEvents, setAssignedEvents] = useState([]);
    
    // Estado para el formulario de edición (coincide con los campos de la BD)
    const [formData, setFormData] = useState({
        usu_primer_nombre: '',
        usu_segundo_nombre: '',
        usu_primer_apellido: '',
        usu_segundo_apellido: '',
        usu_telefono: '',
        usu_correo: '',
        usu_direccion: '',
        are_id: ''
    });

    // Estados para el verificador de disponibilidad
    const [checkDate, setCheckDate] = useState('');
    const [checkTime, setCheckTime] = useState('');
    const [availabilityMessage, setAvailabilityMessage] = useState('');

    // Función para cargar todos los datos del consultor desde la API, envuelta en useCallback
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [consultorRes, programacionesRes] = await Promise.all([
                apiService.getConsultorByCedula(cedula),
                apiService.getProgramacionesByConsultor(cedula)
            ]);

            if (consultorRes.success) {
                const data = consultorRes.data;
                setConsultor(data);
                // Poblar el formulario con los datos recibidos
                setFormData({
                    usu_primer_nombre: data.usu_primer_nombre || '',
                    usu_segundo_nombre: data.usu_segundo_nombre || '',
                    usu_primer_apellido: data.usu_primer_apellido || '',
                    usu_segundo_apellido: data.usu_segundo_apellido || '',
                    usu_telefono: data.usu_telefono || '',
                    usu_correo: data.usu_correo || '',
                    usu_direccion: data.usu_direccion || '',
                    are_id: data.are_id || ''
                });
            } else {
                throw new Error(consultorRes.message || 'No se pudo cargar el consultor');
            }
            
            if (programacionesRes.success) {
                setAssignedEvents(programacionesRes.data.programaciones || []);
            } else {
                throw new Error(programacionesRes.message || 'No se pudieron cargar las programaciones');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cedula]);

    // Llama a loadData cuando el componente se monta o cuando la cédula cambia
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        alert('Funcionalidad para guardar cambios aún no implementada en el backend.');
        // Lógica futura:
        // try {
        //     await apiService.updateConsultor(cedula, formData); // Necesitarás crear este método en api.js
        //     alert('Consultor actualizado con éxito');
        //     navigate('/gestora/consultores');
        // } catch (err) {
        //     setError(err.message);
        // }
    };

    // Esta función ahora representa "Desasignar" el evento
    const handleDesasignarEvento = async (eventId) => {
        if (window.confirm('¿Estás seguro de que quieres desasignar este evento del consultor?')) {
            try {
                setLoading(true);
                await apiService.deleteProgramacion(eventId);
                alert('Evento desasignado y eliminado con éxito.');
                await loadData(); // Recarga los datos para refrescar la lista
            } catch (err) {
                setError(err.message || 'Error al desasignar el evento.');
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleEditEvent = (eventToEdit) => {
        // La lógica para editar un evento navega a la página de programación
        localStorage.setItem('programacionEditar', JSON.stringify({
            id: eventToEdit.id,
            tipo: eventToEdit.type,
            data: eventToEdit 
        }));
        navigate('/gestora/nueva-programacion?mode=edit');
    };

    // Función para normalizar la hora a formato HH:mm:ss
    const normalizeTime = (time) => {
        if (time && time.length === 5) return `${time}:00`;
        return time;
    };

    // Función para construir un Date en hora local a partir de fecha y hora
    const parseLocalDateTime = (dateStr, timeStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute, second] = timeStr.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, second || 0);
    };

    // Función para convertir fechas DD/MM/YYYY a YYYY-MM-DD
    const toISODate = (dateStr) => {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
    };

    // Función para extraer solo la fecha de un string tipo ISO
    const extractDate = (dateTimeStr) => {
        return dateTimeStr.split('T')[0];
    };

    const handleCheckAvailability = () => {
        if (!checkDate || !checkTime) {
            return setAvailabilityMessage('Por favor, ingresa fecha y hora.');
        }
        const checkTimeNorm = normalizeTime(checkTime);
        const checkDateISO = toISODate(checkDate);
        const checkDateTime = parseLocalDateTime(checkDateISO, checkTimeNorm);

        const conflictingEvent = assignedEvents.find(event => {
            console.log('Evento a comparar:', event);
            if (!event.date || !event.time || !event.end_time) return false;
            const eventDate = extractDate(event.date);
            const eventStart = parseLocalDateTime(eventDate, normalizeTime(event.time));
            const eventEnd = parseLocalDateTime(eventDate, normalizeTime(event.end_time));
            console.log('checkDateTime', checkDateTime, checkDateTime.getTime());
            console.log('eventStart', eventStart, eventStart.getTime());
            console.log('eventEnd', eventEnd, eventEnd.getTime());
            return checkDateTime.getTime() >= eventStart.getTime() && checkDateTime.getTime() < eventEnd.getTime();
        });

        setAvailabilityMessage(
            conflictingEvent
                ? `${consultor.usu_primer_nombre} NO está disponible. Conflicto con: "${conflictingEvent.title}".`
                : `${consultor.usu_primer_nombre} SÍ está disponible en ese horario.`
        );
    };

    if (loading) return <DashboardLayout><div className="loading-container"><div className="loading-spinner"></div><p>Cargando perfil del consultor...</p></div></DashboardLayout>;
    if (error) return <DashboardLayout><div>Error: {error} <button onClick={loadData}>Reintentar</button></div></DashboardLayout>;
    if (!consultor) return <DashboardLayout><div>Consultor no encontrado.</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="consultor-form">
                <div className="page-header">
                    <h1>Perfil de {consultor.usu_primer_nombre} {consultor.usu_primer_apellido}</h1>
                    <Link to="/gestora/consultores" className="cancel-button">
                        <FaTimes /> Volver a la lista
                    </Link>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3><FaUser /> Información Personal</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="usu_primer_nombre">Primer Nombre</label>
                                <input id="usu_primer_nombre" name="usu_primer_nombre" value={formData.usu_primer_nombre} onChange={handleInputChange} />
                            </div>
                             {/* Repite para todos los campos del formulario: segundo_nombre, apellidos, etc. */}
                             <div className="form-group">
                                <label htmlFor="usu_correo"><FaEnvelope /> Correo Electrónico</label>
                                <input type="email" id="usu_correo" name="usu_correo" value={formData.usu_correo} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="usu_telefono"><FaPhone /> Teléfono</label>
                                <input type="tel" id="usu_telefono" name="usu_telefono" value={formData.usu_telefono} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><FaClock/> Verificar Disponibilidad</h3>
                        <div className="availability-inputs">
                            <div className="form-group">
                                <label htmlFor="checkDate">Fecha</label>
                                <input type="date" id="checkDate" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="checkTime">Hora</label>
                                <input type="time" id="checkTime" value={checkTime} onChange={(e) => setCheckTime(e.target.value)} />
                            </div>
                            <button type="button" onClick={handleCheckAvailability} className="check-availability-button">Verificar</button>
                        </div>
                        {availabilityMessage && (
                            <p className={`availability-message ${availabilityMessage.includes('NO') ? 'not-available' : 'available'}`}>
                                {availabilityMessage}
                            </p>
                        )}
                    </div>

                    <div className="form-section">
                        <h3><FaCalendarAlt /> Eventos Asignados ({assignedEvents.length})</h3>
                        {assignedEvents.length > 0 ? (
                             <div className="assigned-events-list-container">
                                 <div className="assigned-events-list-header">
                                    <div className="header-cell event-title-col">Evento</div>
                                            <div className="header-cell event-date-col">Fecha</div>
                                            <div className="header-cell event-time-col">Inicio</div>
                                            <div className="header-cell event-endTime-col">Fin</div>
                                            <div className="header-cell event-location-col">Lugar</div>
                                            <div className="header-cell event-status-col">Estado</div>
                                            <div className="header-cell event-actions-col">Acciones</div>
                                 </div>
                                 <div className="assigned-events-list-body">
                                     {assignedEvents.map(event => (
                                         <div key={event.id} className="assigned-event-list-item">
                                             <div className="event-cell event-title-col">{event.title}</div>
                                             <div className="event-cell event-date-col">{new Date(event.date).toLocaleDateString()}</div>
                                             <div className="event-cell event-time-col" data-label="Inicio">{event.time}</div>
                                             <div className="event-cell event-endTime-col" data-label="Fin">{event.end_time}</div>
                                                    <div className="event-cell event-location-col" data-label="Lugar">{event.location}</div>
                                                    <div className="event-cell event-status-col" data-label="Estado">{event.status}</div>
                                             <div className="event-cell event-actions-col">
                                                 <button type="button" onClick={() => handleEditEvent(event)} className="edit-assigned-event-button"><FaPencilAlt /> Editar</button>
                                                 <button onClick={() => handleDesasignarEvento(event.id)} className="delete-assigned-event-button" title="Desasignar Evento"><FaTrash />Desasignar</button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        ) : (
                            <p className="no-events-message">No hay eventos asignados a este consultor.</p>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-button"><FaSave /> Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

export default ConsultorDetailPage;