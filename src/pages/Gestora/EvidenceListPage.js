import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EvidenceListPage.css';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserTie, FaFileAlt, FaImage, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaPlus, FaEdit, FaTrashAlt, FaCommentDots, FaPaperPlane, FaBan } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import apiService from '../../utils/api';

const EvidenceListPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [consultantFilter, setConsultantFilter] = useState('all');
    const [showFeedbackArea, setShowFeedbackArea] = useState(null);
    const [currentFeedback, setCurrentFeedback] = useState('');

    useEffect(() => {
        async function fetchEvidencias() {
            try {
                const evidencias = await apiService.getEvidenciasParaProfesional();
                setEvents(evidencias);
                setFilteredEvents(evidencias);
            } catch (error) {
                alert('Error al cargar evidencias');
            }
        }
        fetchEvidencias();
    }, []);

    useEffect(() => {
        let updatedEvents = events;

        if (searchTerm) {
            updatedEvents = updatedEvents.filter(event =>
                (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (event.consultant && event.consultant.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (statusFilter !== 'all') {
            updatedEvents = updatedEvents.filter(event => event.evidenceStatus === statusFilter);
        }

        if (consultantFilter !== 'all') {
             updatedEvents = updatedEvents.filter(event => event.consultant === consultantFilter);
        }

        setFilteredEvents(updatedEvents);
    }, [searchTerm, statusFilter, consultantFilter, events]);

    const consultants = [...new Set(events.map(event => event.consultant))];

    const handleViewEvidence = async (endpoint, name) => {
        try {
            const { blob, filename } = await apiService.downloadFile(endpoint);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename || name || 'evidencia';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('No se pudo descargar la evidencia');
        }
    };

    const handleConfirmEvidences = async (eventId, tipoEvidencia) => {
        try {
            await apiService.confirmarEvidencias({ tipo_evidencia: tipoEvidencia, id: eventId });
            const evidencias = await apiService.getEvidenciasParaProfesional();
            setEvents(evidencias);
            setFilteredEvents(evidencias);
            setShowFeedbackArea(null);
            setCurrentFeedback('');
        } catch (error) {
            alert('Error al confirmar evidencia');
        }
    };

    const handleReturnEvidences = (eventId, existingFeedback = '') => {
        setShowFeedbackArea(eventId);
        setCurrentFeedback(existingFeedback || '');
    };

    const handleCancelFeedback = () => {
        setShowFeedbackArea(null);
        setCurrentFeedback('');
    };

    const handleSubmitFeedback = async (eventId, tipoEvidencia) => {
        try {
            await apiService.submitFeedback({ tipo_evidencia: tipoEvidencia, id: eventId, feedback: currentFeedback });
            const evidencias = await apiService.getEvidenciasParaProfesional();
            setEvents(evidencias);
            setFilteredEvents(evidencias);
            setShowFeedbackArea(null);
            setCurrentFeedback('');
        } catch (error) {
            alert('Error al enviar feedback');
        }
    };

    const getEvidenceIcon = (type) => {
        switch (type) {
            case 'document':
                return <FaFileAlt className="document-icon" />;
            case 'image':
                return <FaImage className="document-icon" />;
            default:
                return <FaFileAlt className="document-icon" />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Pendiente':
                return 'status-pendiente-revisión';
            case 'Evidencias Aceptadas':
                return 'status-evidencias-aceptadas';
            case 'Evidencias Devueltas':
                return 'status-evidencias-devueltas';
            default:
                return '';
        }
    };

    return (
        <DashboardLayout>
            <div className="evidence-list-container">
                <header className="list-header">
                    <h2>Gestión de Evidencias</h2>
                    <div className="header-actions">
                        <button className="btn-go-to-dashboard" onClick={() => navigate('/gestora')}>
                            <FaArrowLeft /> Volver al Dashboard
                        </button>
                        <button 
                            className="btn-add-programacion" 
                            onClick={() => navigate('/gestora/nueva-programacion')}
                        >
                            <FaPlus /> Añadir Programación
                        </button>
                    </div>
                </header>

                <section className="filters-section">
                    <div className="filter-group">
                        <label htmlFor="search">Buscar Evento/Consultor:</label>
                        <input
                            type="text"
                            id="search"
                            className="filter-input"
                            placeholder="Escribe para buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label htmlFor="status-filter">Estado de Evidencias:</label>
                        <select
                            id="status-filter"
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Evidencias Aceptadas">Evidencias Aceptadas</option>
                            <option value="Evidencias Devueltas">Evidencias Devueltas</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="consultant-filter">Consultor:</label>
                        <select
                            id="consultant-filter"
                            className="filter-select"
                            value={consultantFilter}
                            onChange={(e) => setConsultantFilter(e.target.value)}
                        >
                            <option value="all">Todos los Consultores</option>
                            {consultants.map(consultant => (
                                <option key={consultant} value={consultant}>{consultant}</option>
                            ))}
                        </select>
                    </div>
                </section>

                <div className="events-evidence-list">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <article key={event.id} className={`event-evidence-block ${getStatusClass(event.evidenceStatus)}`}>
                                <div className="event-content">
                                    <div className="event-details">
                                        <h3>{event.title}</h3>
                                        <p><strong><FaCalendarAlt /> Fecha:</strong> {event.date}</p>
                                        <p><strong><FaClock /> Hora:</strong> {event.time}</p>
                                        <p><strong><FaMapMarkerAlt /> Ubicación:</strong> {event.location}</p>
                                        <p><strong><FaUserTie /> Consultor:</strong> {event.consultant}</p>
                                        <p>
                                            <strong>Estado:</strong>
                                            <span className="evidence-status">
                                                {event.evidenceStatus}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="evidence-items">
                                        <h4>Evidencias Enviadas ({event.evidences.length})</h4>
                                        {event.evidences.length > 0 ? (
                                            <div className="evidence-grid">
                                                {event.evidences.map(evidence => (
                                                    <div key={evidence.id} className="evidence-item-preview">
                                                        {evidence.type === 'image' && evidence.previewUrl ? (
                                                            <img src={evidence.previewUrl} alt={evidence.name} onError={(e) => e.target.src = 'https://placehold.co/80x80/ff0000/ffffff?text=Error'} />
                                                        ) : (
                                                            getEvidenceIcon(evidence.type)
                                                        )}
                                                        <p>{evidence.name}</p>
                                                        <a
                                                            href={evidence.url}
                                                            className="view-evidence-link"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                let endpoint = evidence.url.startsWith('/api/')
                                                                    ? evidence.url.replace('/api', '')
                                                                    : evidence.url;
                                                                handleViewEvidence(endpoint, evidence.name);
                                                            }}
                                                        >
                                                            Ver
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="no-evidence-for-event">No hay evidencias para este evento.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="gestora-actions">
                                    {event.evidenceStatus === 'Pendiente' && (
                                        <>
                                            <button className="btn-confirm" onClick={() => handleConfirmEvidences(event.id, event.tipo_evidencia)}>
                                                <FaCheckCircle /> Confirmar Evidencias
                                            </button>
                                            <button className="btn-return" onClick={() => handleReturnEvidences(event.id, event.feedback)}>
                                                <FaTimesCircle /> Devolver Evidencias
                                            </button>
                                        </>
                                    )}
                                    {event.evidenceStatus === 'Evidencias Aceptadas' && event.feedback && (
                                        <div className="feedback-display">
                                            <strong>Feedback Enviado:</strong>
                                            <p>{event.feedback}</p>
                                        </div>
                                    )}
                                    {event.evidenceStatus === 'Evidencias Devueltas' && event.feedback && (
                                        <div className="feedback-display status-returned">
                                            <strong>Feedback Enviado:</strong>
                                            <p>{event.feedback}</p>
                                            {showFeedbackArea !== event.id && (
                                                <button className="btn-edit-feedback" onClick={() => handleReturnEvidences(event.id, event.feedback)}>
                                                    <FaEdit /> Editar Feedback
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {showFeedbackArea === event.id && (
                                        <div className="feedback-area">
                                            <textarea
                                                placeholder="Escribe tu feedback aquí..."
                                                value={currentFeedback}
                                                onChange={(e) => setCurrentFeedback(e.target.value)}
                                            ></textarea>
                                            <div className="feedback-buttons">
                                                <button className="btn-cancel-feedback" onClick={handleCancelFeedback}>
                                                    <FaBan /> Cancelar
                                                </button>
                                                <button
                                                    className="btn-submit-feedback"
                                                    onClick={() => handleSubmitFeedback(event.id, event.tipo_evidencia)}
                                                    disabled={!currentFeedback.trim()}
                                                >
                                                    <FaPaperPlane /> Enviar Feedback
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))
                    ) : (
                        <p className="no-evidence-message">No se encontraron eventos con las evidencias correspondientes a los filtros.</p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EvidenceListPage;