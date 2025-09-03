// src/pages/Consultor/ConsultorDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import ConsultorLayout from '../../components/ConsultorLayout';
import { Calendar, momentLocalizer } from 'react-big-calendar'; // <-- Importamos de la librería
import moment from 'moment';
import 'moment/locale/es'; // Español para moment
import 'react-big-calendar/lib/css/react-big-calendar.css'; // <-- Importamos el CSS
import './ConsultorDashboardPage.css';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../utils/api';
moment.locale('es');
const localizer = momentLocalizer(moment);

const ConsultorDashboardPage = () => {
    const { userData, loading: authLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // Función de carga de datos envuelta en useCallback para estabilidad
    const fetchConsultorEvents = useCallback(async () => {
        if (!userData?.user?.usu_cedula) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = { consultorCedula: userData.user.usu_cedula };
            const res = await apiService.getProgramaciones(params);

            if (res.success) {
                // Transformar los datos recibidos de la API al formato que el calendario necesita
                const formattedEvents = res.data.programaciones.map(prog => {
                    // --- INICIO DE LA CORRECCIÓN ---
                    // 1. Extraemos solo la parte de la fecha (YYYY-MM-DD) para evitar conflictos.
                    const dateOnly = moment(prog.date).format('YYYY-MM-DD');
                    
                    // 2. Creamos strings de fecha-hora válidos y luego los convertimos a objetos Date.
                    const startDate = moment(`${dateOnly}T${prog.time}`).toDate();
                    const endDate = moment(`${dateOnly}T${prog.end_time}`).toDate();
                    // --- FIN DE LA CORRECCIÓN ---
                     // Agregamos un log para depurar y ver las fechas creadas
                    console.log(`Evento: ${prog.title}, Start: ${startDate}, End: ${endDate}`);
                    
                    return {
                        id: prog.id,
                        title: prog.title,
                        start: startDate,
                        end: endDate,
                        // Guardamos todos los demás datos para mostrarlos en el modal
                        ...prog 
                    };
                });
                setEvents(formattedEvents);
            } else {
                throw new Error(res.message || 'Error al cargar los eventos');
            }
        } catch (err) {
            setError('Hubo un error al cargar los eventos.');
            console.error('❌ Error cargando eventos:', err);
        } finally {
            setLoading(false);
        }
    }, [userData?.user?.usu_cedula]);

    useEffect(() => {
        if (!authLoading) {
            fetchConsultorEvents();
        }
    }, [authLoading, fetchConsultorEvents]);

    const handleSelectEvent = (event) => {
        console.log("🎯 Evento seleccionado:", event);
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    return (
        <ConsultorLayout>
            <div className="consultor-dashboard-container">
                <h2>Mi Calendario de Eventos</h2>
                {loading && <p>Cargando eventos...</p>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && (
                    <div style={{ height: '70vh' }}> {/* Damos altura al calendario */}
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ flex: 1 }}
                            messages={{
                                next: "Siguiente",
                                previous: "Anterior",
                                today: "Hoy",
                                month: "Mes",
                                week: "Semana",
                                day: "Día",
                                agenda: "Agenda",
                                date: "Fecha",
                                time: "Hora",
                                event: "Evento",
                            }}
                            onSelectEvent={handleSelectEvent}
                        />
                    </div>
                )}

                {/* El modal de detalles ahora mostrará datos reales */}
                {selectedEvent && (
                <div className={`event-detail-modal-overlay ${selectedEvent ? 'visible' : ''}`} onClick={handleCloseModal}>
                    <div className="event-detail-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{selectedEvent.title}</h3>
                        <p><strong>Programa:</strong> {selectedEvent.program_name}</p>
                        <p><strong>Temática:</strong> {selectedEvent.title}</p>
                        <p><strong>Tipo:</strong> {selectedEvent.activity_type}</p>
                        <p><strong>Modalidad:</strong> {selectedEvent.modality}</p>
                        <p><strong>Fecha:</strong> {moment(selectedEvent.start).format('DD/MM/YYYY')}</p>
                        <p><strong>Hora:</strong> {`${moment(selectedEvent.start).format('hh:mm A')} - ${moment(selectedEvent.end).format('hh:mm A')}`}</p>
                        <p><strong>Lugar/Enlace:</strong> {selectedEvent.location || selectedEvent.link}</p>
                        <p><strong>Estado:</strong> {selectedEvent.status || 'Programado'}</p>
                        
                        {selectedEvent.type === 'individual' && (
                            <>
                                <h4>Detalles de Asesoría</h4>
                                <p><strong>Empresario:</strong> {selectedEvent.business_person}</p>
                                <p><strong>ID Empresario:</strong> {selectedEvent.business_id}</p>
                            </>
                        )}
                        
                        <button onClick={handleCloseModal} className="close-modal-button">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
        </ConsultorLayout>
    );
};

export default ConsultorDashboardPage;