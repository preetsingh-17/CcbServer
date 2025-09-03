import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsultorLayout from '../../components/ConsultorLayout';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../utils/api';
import moment from 'moment';
import 'moment/locale/es';
import { FaSearch, FaCalendarAlt, FaTag, FaFilter, FaTimes, FaUsers, FaClock} from 'react-icons/fa';
import './ConsultorEventList.css'; // Importamos el nuevo CSS

moment.locale('es');

const ConsultorEventListPage = () => {
    const { userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estado unificado para todos los filtros
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'todos',
        type: 'todos',
        dateFrom: '',
        dateTo: ''
    });

    // Envuelve la función de carga en useCallback para estabilizarla
    const fetchConsultorEvents = useCallback(async () => {
        if (!authLoading && userData?.user?.usu_cedula) {
            // No mostramos el spinner de carga para actualizaciones en segundo plano,
            // solo para la carga inicial.
            // setLoading(true); 
            setError(null);
            try {
                const params = { consultorCedula: userData.user.usu_cedula };
                const res = await apiService.getProgramaciones(params);
                if (res.success) {
                    const eventsWithDefaults = res.data.programaciones.map(e => ({
                        ...e,
                        status: e.status || 'Programado'
                    }));
                    setAllEvents(eventsWithDefaults || []);
                } else {
                    throw new Error(res.message);
                }
            } catch (err) {
                setError('Hubo un error al cargar los eventos.');
            } finally {
                setLoading(false); // Aseguramos que el estado de carga finalice
            }
        }
    }, [userData, authLoading]);

    // Efecto para la carga inicial de datos
    useEffect(() => {
        setLoading(true); // Activa el spinner solo en la carga inicial
        fetchConsultorEvents();
    }, [fetchConsultorEvents]);

    // Efecto para recargar los datos cuando la ventana/pestaña vuelve a estar activa
    useEffect(() => {
        const handleFocus = () => {
            console.log('Window focused, refetching events...'); // Para depuración
            fetchConsultorEvents();
        };

        window.addEventListener('focus', handleFocus);

        // Limpia el listener cuando el componente se desmonte para evitar fugas de memoria
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchConsultorEvents]); // La dependencia es la función de carga estabilizada
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            searchTerm: '',
            status: 'todos',
            type: 'todos',
            dateFrom: '',
            dateTo: ''
        });
    };

    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const { searchTerm, status, type, dateFrom, dateTo } = filters;
            
            const searchTermMatch = searchTerm ? (
                event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.program_name?.toLowerCase().includes(searchTerm.toLowerCase())
            ) : true;

            const statusMatch = status !== 'todos' ? event.status === status : true;
            const typeMatch = type !== 'todos' ? event.type === type : true;
            
            const eventDate = moment(event.date);
            const dateFromMatch = dateFrom ? eventDate.isSameOrAfter(moment(dateFrom), 'day') : true;
            const dateToMatch = dateTo ? eventDate.isSameOrBefore(moment(dateTo), 'day') : true;

            return searchTermMatch && statusMatch && typeMatch && dateFromMatch && dateToMatch;
        });
    }, [allEvents, filters]);

    const handleEventClick = (event) => {
        if (['Programado', 'Realizada', 'Evidencias Devueltas'].includes(event.status)) {
            navigate(`/consultor/events/${event.id}`, { state: { event } });
        } else {
            alert(`Las evidencias para este evento están en estado: ${event.status} y no se pueden modificar.`);
        }
    };

    if (loading) return <ConsultorLayout><div className="loading-message">Cargando eventos...</div></ConsultorLayout>;
    if (error) return <ConsultorLayout><p className="error-message">{error}</p></ConsultorLayout>;

    return (
        <ConsultorLayout>
            <div className="consultor-event-list-container">
                <header className="page-header">
                    <h1>Mis Eventos Asignados</h1>
                    <p>Encuentra, filtra y gestiona todas tus programaciones.</p>
                </header>

                <div className="filters-card">
                    <div className="filters-header">
                        <FaFilter />
                        <h3>Filtros de Búsqueda</h3>
                    </div>
                    <div className="filters-container">
                        <div className="filter-group search-bar">
                             <FaSearch className="filter-icon" />
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="Buscar por título o programa..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="filter-group">
                             <FaTag className="filter-icon" />
                             <select name="status" value={filters.status} onChange={handleFilterChange}>
                                 <option value="todos">Todos los Estados</option>
                                 <option value="Programado">Programado</option>
                                 <option value="Realizada">Realizada</option>
                                 <option value="Pendiente">Pendiente de Revisión</option>
                                 <option value="Evidencias Aceptadas">Aceptada</option>
                                 <option value="Evidencias Devueltas">Devuelta</option>
                                 <option value="Cancelado">Cancelado</option>
                             </select>
                        </div>
                         <div className="filter-group">
                             <FaUsers className="filter-icon" />
                             <select name="type" value={filters.type} onChange={handleFilterChange}>
                                 <option value="todos">Todos los Tipos</option>
                                 <option value="grupal">Grupal</option>
                                 <option value="individual">Individual</option>
                             </select>
                        </div>
                        <div className="filter-group">
                            <FaCalendarAlt className="filter-icon" />
                            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
                        </div>
                        <button onClick={resetFilters} className="reset-button">
                            <FaTimes /> Limpiar Filtros
                        </button>
                    </div>
                </div>

                <div className="event-list">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <div key={event.id} className="event-card" onClick={() => handleEventClick(event)}>
                                <div className="event-card-main">
                                    <span className={`event-type-badge type-${event.type}`}>{event.type}</span>
                                    <h4 className="event-title">{event.title}</h4>
                                    <p className="event-program">{event.program_name || 'Programa no especificado'}</p>
                                </div>
                                <div className="event-card-details">
                                    <div className="detail-item">
                                        <FaCalendarAlt />
                                        <span>{moment(event.date).format('dddd, DD [de] MMMM')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <FaClock />
                                        <span>{moment(event.time, "HH:mm:ss").format('hh:mm A')}</span>
                                    </div>
                                </div>
                                <div className="event-card-status">
                                     <span className={`status-badge status-${(event.status || '').replace(/\s+/g, '-').toLowerCase()}`}>
                                         {event.status}
                                     </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-events-message">
                            <p>No se encontraron eventos que coincidan con tus filtros.</p>
                        </div>
                    )}
                </div>
            </div>
        </ConsultorLayout>
    );
};

export default ConsultorEventListPage;