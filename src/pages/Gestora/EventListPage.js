import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import EventItem from '../../components/EventItem';
import './EventListPage.css';
import { FaPlus, FaArrowLeft, FaSync, FaFilter } from 'react-icons/fa';
import apiService from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModality, setFilterModality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [filterType, setFilterType] = useState('all'); // grupal/individual
  const [filterProgram, setFilterProgram] = useState('all');
  
  // Estados para datos de referencia
  const [modalidades, setModalidades] = useState([]);
  const [programas, setProgramas] = useState([]);
  
  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    grupales: 0,
    individuales: 0
  });

  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (!authLoading && userData && userData.user && userData.user.usu_cedula) {
      loadAllData(userData.user.usu_cedula);
    }
  }, [userData, authLoading]);

  // Función para cargar todos los datos
  const loadAllData = async (gestoraCedula) => {
    try {
      setLoading(true);
      setError(null);

      // Cargar programaciones y datos de referencia en paralelo
      const [
        programacionesRes,
        modalidadesRes,
        programasRes
      ] = await Promise.all([
        apiService.getProgramaciones({ gestoraCedula }),
        apiService.getModalidades(),
        apiService.getProgramaRutas()
      ]);

      if (programacionesRes.success) {
        const programaciones = programacionesRes.data.programaciones;
        
        // Transformar datos para que coincidan con el formato esperado por EventItem
        const eventosTransformados = programaciones.map(prog => ({
          id: prog.id,
          title: prog.title,
          location: prog.location,
          date: prog.date,
          time: prog.time,
          endTime: prog.end_time,
          program: prog.program_name,
          specialty: prog.area_conocimiento,
          modality: prog.modality,
          status: prog.status || 'Programado',
          instructor: prog.instructor,
          participants: prog.participants,
          type: prog.type,
          hours: prog.hours,
          coordinator: prog.coordinator,
          link: prog.link,
          contract: prog.contract,
          total_value: prog.total_value,
          program_name: prog.program_name,
          route_name: prog.route_name,
          activity_type: prog.activity_type,
          area_conocimiento: prog.area_conocimiento
        }));

        // Ordenar por fecha (más recientes primero)
        const eventosOrdenados = eventosTransformados.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });

        setEvents(eventosOrdenados);

        // Calcular estadísticas
        const statsData = {
          total: eventosOrdenados.length,
          grupales: eventosOrdenados.filter(e => e.type === 'grupal').length,
          individuales: eventosOrdenados.filter(e => e.type === 'individual').length
        };
        setStats(statsData);

        console.log('✅ Programaciones cargadas:', eventosOrdenados.length);
      } else {
        throw new Error(programacionesRes.message || 'Error al cargar programaciones');
      }

      // Cargar datos de referencia para filtros
      if (modalidadesRes.success) {
        setModalidades(modalidadesRes.data.modalidades);
      }

      if (programasRes.success) {
        setProgramas(programasRes.data.programas);
      }

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error al cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la eliminación de un evento
  const handleDelete = async (id) => {
    console.log('🗑️ Intentando eliminar programación:', id);
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta programación? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        
        // Llamar a la API para eliminar
        const result = await apiService.deleteProgramacion(id);
        
        if (result.success) {
          // Actualizar la lista local
          const updatedEvents = events.filter(event => event.id !== id);
          setEvents(updatedEvents);
          
          // Actualizar estadísticas
          const newStats = {
            total: updatedEvents.length,
            grupales: updatedEvents.filter(e => e.type === 'grupal').length,
            individuales: updatedEvents.filter(e => e.type === 'individual').length
          };
          setStats(newStats);
          
          console.log('✅ Programación eliminada exitosamente:', id);
          
          const tipoPrograma = id.startsWith('grupal_') ? 'grupal' : 'individual';
          alert(`✅ Programación ${tipoPrograma} eliminada exitosamente.`);
          
        } else {
          throw new Error(result.message || 'Error al eliminar la programación');
        }
        
      } catch (error) {
        console.error('❌ Error eliminando programación:', error);
        alert(`❌ Error al eliminar la programación: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para manejar la edición de un evento
  const handleEdit = async (id) => {
    try {
      console.log('✏️ Intentando editar programación:', id);
      
      // Obtener datos de la programación para editar
      const result = await apiService.getProgramacion(id);
      
      if (result.success) {
        const { programacion, tipo } = result.data;
        console.log('📋 Datos de programación obtenidos:', programacion);
        
        // Guardar datos en localStorage para que los tome NuevaProgramacionPage
        localStorage.setItem('programacionEditar', JSON.stringify({
          id,
          tipo,
          data: programacion
        }));
        
        // Navegar a la página de edición
        navigate('/gestora/nueva-programacion?mode=edit');
        
      } else {
        throw new Error(result.message || 'Error al obtener los datos de la programación');
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo datos para editar:', error);
      alert(`❌ Error al cargar la programación para editar: ${error.message}`);
    }
  };

  // Función para navegar a nueva programación
  const handleAddEvent = () => {
    console.log('Navegando a la página para agregar nueva programación');
    navigate('/gestora/nueva-programacion');
  };

  // Función para volver al dashboard
  const handleGoToDashboard = () => {
    console.log('Navegando de vuelta al dashboard');
    navigate('/gestora');
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterModality('all');
    setFilterStatus('all');
    setFilterDate('');
    setFilterTime('');
    setFilterType('all');
    setFilterProgram('all');
  };

  // Filtrar eventos basado en los estados de filtro
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.route_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModality = filterModality === 'all' || event.modality === filterModality;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesProgram = filterProgram === 'all' || event.program_name === filterProgram;

    // Filtro de fecha
    const matchesDate = filterDate === '' || event.date === filterDate;

    // Filtro de hora (buscar eventos que inicien en esa hora)
    const matchesTime = filterTime === '' || event.time.startsWith(filterTime.slice(0, 2));

    return matchesSearch && matchesModality && matchesStatus && matchesType && 
           matchesProgram && matchesDate && matchesTime;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="event-list-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando programaciones...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="event-list-container">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadAllData} className="btn-add-programacion">
              <FaSync /> Reintentar
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="event-list-container">
        <div className="list-header">
          <div className="header-title">
            <h2>Lista de Programaciones</h2>
            <div className="stats-summary">
              <span className="stat-item">Total: {stats.total}</span>
              <span className="stat-item">Grupales: {stats.grupales}</span>
              <span className="stat-item">Individuales: {stats.individuales}</span>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              className="btn-add-programacion"
              onClick={handleAddEvent}
            >
              <FaPlus /> {isMobile ? 'Nueva' : 'Agregar Programación'}
            </button>
            <button
              className="btn-go-to-dashboard"
              onClick={handleGoToDashboard}
            >
              <FaArrowLeft /> {isMobile ? 'Dashboard' : 'Volver al Dashboard'}
            </button>
            <button
              className="btn-reload"
              onClick={loadAllData}
              disabled={loading}
            >
              <FaSync /> {isMobile ? 'Recargar' : 'Recargar Datos'}
            </button>
          </div>
        </div>

        {/* Sección de filtros mejorada */}
        <div className="filter-section">
          <div className="filter-header">
            <h3><FaFilter /> Filtros</h3>
            <button onClick={clearFilters} className="clear-filters-btn">
              Limpiar Filtros
            </button>
          </div>
          
          <div className="filter-grid">
            <input
              type="text"
              placeholder="Buscar (Título, Lugar, Instructor, Programa)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los Tipos</option>
              <option value="grupal">Programaciones Grupales</option>
              <option value="individual">Asesorías Individuales</option>
            </select>
            
            <select
              value={filterModality}
              onChange={(e) => setFilterModality(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las Modalidades</option>
              {modalidades.map((modalidad) => (
                <option key={modalidad.mod_id} value={modalidad.mod_nombre}>
                  {modalidad.mod_nombre}
                </option>
              ))}
            </select>
            
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los Programas</option>
              {programas.map((programa) => (
                <option key={programa.prog_id} value={programa.prog_nombre}>
                  {programa.prog_nombre}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los Estados</option>
              <option value="Programado">Programado</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
              placeholder="Filtrar por fecha"
            />
            
            <input
              type="time"
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="filter-input"
              placeholder="Filtrar por hora"
            />
          </div>
        </div>

        {/* Lista de EventItems */}
        <div className="event-items-list">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventItem
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isMobile={isMobile}
              />
            ))
          ) : (
            <div className="no-events-message">
              {searchTerm || filterModality !== 'all' || filterStatus !== 'all' || 
               filterDate || filterTime || filterType !== 'all' || filterProgram !== 'all' ? (
                <>
                  <p>No se encontraron programaciones que coincidan con los criterios de filtro.</p>
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Limpiar Filtros
                  </button>
                </>
              ) : (
                <>
                  <p>No hay programaciones para mostrar.</p>
                  <button onClick={handleAddEvent} className="btn-add-programacion">
                    <FaPlus /> Crear Primera Programación
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Información adicional */}
        {filteredEvents.length > 0 && (
          <div className="results-info">
            <p>Mostrando {filteredEvents.length} de {events.length} programaciones</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EventListPage;
