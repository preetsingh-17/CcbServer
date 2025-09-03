import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ConsultorLayout from '../../components/ConsultorLayout';
import apiService from '../../utils/api';
// CORRECCIÓN 3: Asegurarse de que FaExclamationCircle esté importado
import { FaInfoCircle, FaUsers, FaFileUpload, FaSave, FaTimes, FaUserTie, FaDollarSign, FaPaperclip, FaCheckCircle, FaEye, FaExclamationCircle } from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/es';
import './ConsultorEventDetail.css';

moment.locale('es');

function ConsultorEventDetailPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [event, setEvent] = useState(location.state?.event || null);
    const [responsables, setResponsables] = useState([]);
    const [formData, setFormData] = useState({
        numero_asistentes: '',
        razon_social: '',
        nombre_asesorado: '',
        identificacion_asesorado: '',
        tematica_dictada: '',
        rr_id: '',
        valor_hora: 0,
        valor_total_horas: 0
    });
    const [evidenciaFile, setEvidenciaFile] = useState(null);
    const [pantallazoFile, setPantallazoFile] = useState(null);
    const [loading, setLoading] = useState(!event);
    const [error, setError] = useState('');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [feedback, setFeedback] = useState('');

    const getNumericId = (id) => {
        if (!id) return null;
        const parts = id.split('_');
        return parts.length > 1 ? parts[1] : null;
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            let currentEvent = event;

            if (!currentEvent && eventId) {
                const res = await apiService.getProgramacion(eventId);
                if (res.success) {
                    const prog = res.data.programacion;
                    currentEvent = {
                        ...prog,
                        id: eventId,
                        type: res.data.tipo,
                        title: prog.pro_tematica || prog.proin_tematica,
                        date: prog.pro_fecha_formacion || prog.proin_fecha_formacion,
                        time: prog.pro_hora_inicio || prog.proin_hora_inicio,
                        end_time: prog.pro_hora_fin || prog.proin_hora_fin,
                        hours: prog.pro_horas_dictar || prog.proin_horas_dictar,
                        location: prog.pro_direccion || prog.proin_direccion,
                        link: prog.pro_enlace || prog.proin_enlace,
                        status: prog.pro_estado || prog.proin_estado || 'Programado'
                    };
                    setEvent(currentEvent);
                } else {
                    throw new Error(res.message || "No se pudo cargar la programación.");
                }
            }

            const responsablesRes = await apiService.getResponsablesRuta();
            if (responsablesRes.success) {
                setResponsables(responsablesRes.data);
            } else {
                throw new Error("No se pudieron cargar los responsables.");
            }

            if (currentEvent) {
                if (currentEvent.status === 'Evidencias Devueltas') {
                    setIsEditMode(true);
                    setIsReadOnly(false);
                    const [evidenceRes, feedbackRes] = await Promise.all([
                        apiService.getEvidence(eventId),
                        apiService.getEvidenceFeedback(currentEvent.type, eventId)
                    ]);
                    if (evidenceRes.success) {
                        const ed = evidenceRes.data;
                        setFormData({
                            tematica_dictada: ed.evi_tematica_dictada || ed.eviin_tematica_dictada || '',
                            numero_asistentes: ed.evi_numero_asistentes || ed.eviin_numero_asistentes || '',
                            razon_social: ed.eviin_razon_social || '',
                            nombre_asesorado: ed.eviin_nombre_asesorado || '',
                            identificacion_asesorado: ed.eviin_identificacion_asesorado || '',
                            rr_id: ed.rr_id || '',
                            valor_hora: ed.evi_valor_hora || ed.eviin_valor_hora || 0,
                            valor_total_horas: ed.evi_valor_total_horas || ed.eviin_valor_total_horas || 0
                        });
                    }
                    if (feedbackRes.success) {
                        setFeedback(feedbackRes.data.val_observaciones);
                    }
                } else if (['Pendiente', 'Evidencias Aceptadas', 'Realizada'].includes(currentEvent.status)) {
                    setIsReadOnly(true);
                    const evidenceRes = await apiService.getEvidence(eventId);
                    if (evidenceRes.success) {
                        const ed = evidenceRes.data;
                        setFormData({
                           tematica_dictada: ed.evi_tematica_dictada || ed.eviin_tematica_dictada || '',
                           numero_asistentes: ed.evi_numero_asistentes || ed.eviin_numero_asistentes || '',
                           razon_social: ed.eviin_razon_social || '',
                           nombre_asesorado: ed.eviin_nombre_asesorado || '',
                           identificacion_asesorado: ed.eviin_identificacion_asesorado || '',
                           rr_id: ed.rr_id || '',
                           valor_hora: ed.evi_valor_hora || ed.eviin_valor_hora || 0,
                           valor_total_horas: ed.evi_valor_total_horas || ed.eviin_valor_total_horas || 0
                        });
                    }
                } else {
                    setIsReadOnly(false);
                    setIsEditMode(false);
                    const initialFormData = {
                        tematica_dictada: currentEvent.title,
                        valor_hora: currentEvent.pro_valor_hora || currentEvent.proin_valor_hora || 0,
                        valor_total_horas: currentEvent.pro_valor_total_hora_pagar || currentEvent.proin_valor_total_hora_pagar || 0,
                        nombre_asesorado: currentEvent.business_person || currentEvent.proin_nombre_empresario || '',
                        identificacion_asesorado: currentEvent.business_id || currentEvent.proin_identificacion_empresario || ''
                    };
                    setFormData(prev => ({ ...prev, ...initialFormData }));
                }
            }
        } catch (err) {
            setError(err.message || 'No se pudo cargar la información necesaria.');
        } finally {
            setLoading(false);
        }
    }, [eventId, event]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (e.target.name === 'evi_evidencias') setEvidenciaFile(file);
        else if (e.target.name === 'evi_pantallazo_avanza') setPantallazoFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isEditMode && (!formData.rr_id || !evidenciaFile || (event.type === 'individual' && !pantallazoFile))) {
            return setError('Por favor, completa todos los campos y adjunta los archivos requeridos.');
        }
        if (!formData.rr_id) {
            return setError('Debes seleccionar un responsable de ruta.');
        }

        setLoading(true);
        const data = new FormData();
        const numericId = getNumericId(event.id);

        try {
            if (isEditMode) {
                // Para editar, solo enviamos los datos del formulario que pueden cambiar
                data.append('rr_id', formData.rr_id);
                data.append('tematica_dictada', formData.tematica_dictada);
                data.append('numero_asistentes', formData.numero_asistentes);
                 if (event.type === 'individual') {
                    data.append('razon_social', formData.razon_social);
                    data.append('nombre_asesorado', formData.nombre_asesorado);
                    data.append('identificacion_asesorado', formData.identificacion_asesorado);
                    if (pantallazoFile) data.append('evi_pantallazo_avanza', pantallazoFile);
                }
                if (evidenciaFile) data.append('evi_evidencias', evidenciaFile);
                
                await apiService.updateEvidence(event.type, eventId, data);
                alert('Evidencia corregida y enviada con éxito.');
            } else {
                // CORRECCIÓN 2: Lógica de creación de evidencia. Los datos se añaden aquí.
                const eventDate = event.date || event.pro_fecha_formacion;
                const monthName = eventDate ? (moment(eventDate).format('MMMM').charAt(0).toUpperCase() + moment(eventDate).format('MMMM').slice(1)) : 'N/A';
                data.append('tipo', event.type);
                data.append('pro_id', numericId);
                data.append('rr_id', formData.rr_id);
                data.append('mes', monthName);
                data.append('fecha', moment(eventDate).format('YYYY-MM-DD'));
                data.append('hora_inicio', `${moment(eventDate).format('YYYY-MM-DD')} ${event.time || event.pro_hora_inicio}`);
                data.append('hora_fin', `${moment(eventDate).format('YYYY-MM-DD')} ${event.end_time || event.pro_hora_fin}`);
                data.append('horas_dictar', event.hours || event.pro_horas_dictar);
                data.append('valor_hora', event.pro_valor_hora || event.proin_valor_hora || 0);
                data.append('valor_total_horas', event.pro_valor_total_hora_pagar || event.proin_valor_total_hora_pagar || 0);
                data.append('tematica_dictada', formData.tematica_dictada);
                data.append('direccion', event.location || event.pro_direccion);
                data.append('evi_evidencias', evidenciaFile);
                if (event.type === 'individual') {
                    data.append('numero_asistentes', 1);
                    data.append('razon_social', formData.razon_social);
                    data.append('nombre_asesorado', formData.nombre_asesorado);
                    data.append('identificacion_asesorado', formData.identificacion_asesorado);
                    data.append('evi_pantallazo_avanza', pantallazoFile);
                } else {
                    data.append('numero_asistentes', formData.numero_asistentes);
                }
                await apiService.uploadEvidence(data);
                alert('Evidencia cargada con éxito.');
            }
            navigate('/consultor/events');
        } catch (err) {
            setError(err.message || 'Error al procesar la evidencia.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileType) => {
        try {
            const { blob, filename } = await apiService.downloadFile(`/evidencias/download/${eventId}/${fileType}`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message || 'No se pudo descargar el archivo.');
        }
    };

    if (loading) return <ConsultorLayout><div className="loading-message">Cargando...</div></ConsultorLayout>;
    if (error) return <ConsultorLayout><p className="error-message">{error}</p></ConsultorLayout>;
    if (!event) return <ConsultorLayout><p>Evento no encontrado. <Link to="/consultor/events">Volver a la lista</Link></p></ConsultorLayout>;

    return (
        <ConsultorLayout>
            <div className="detail-container">
                <header className="page-header">
                    <h2>{isEditMode ? `Corregir Evidencia: ${event.title}` : isReadOnly ? 'Ver Evidencia Cargada' : `Cargar Evidencia para: ${event.title}`}</h2>
                    <Link to="/consultor/events" className="back-button"><FaTimes /> Volver</Link>
                </header>

                {isEditMode && feedback && (
                    <div className="feedback-alert">
                        <FaExclamationCircle />
                        <div>
                            <strong>Observaciones del Profesional:</strong>
                            <p>{feedback}</p>
                        </div>
                    </div>
                )}
                
                {/* Banner para el estado 'Realizada' */}
                {isReadOnly && event.status === 'Realizada' && (
                     <div className="readonly-banner success-banner">
                        <FaCheckCircle /><span>Este evento ha sido marcado como **Realizado**. La evidencia ya no puede ser modificada.</span>
                    </div>
                )}
                {/* Banner para otros estados de solo lectura */}
                {isReadOnly && ['Pendiente', 'Evidencias Aceptadas'].includes(event.status) && (
                    <div className="readonly-banner"><FaEye /><span>Esta evidencia ya fue cargada y está en modo de solo lectura.</span></div>
                )}

                <form onSubmit={handleSubmit} className="evidence-form">
                    <div className="form-section">
                        <h3 className="section-title"><FaInfoCircle /> Resumen de la Programación</h3>
                        <div className="info-grid readonly">
                            <p><strong>Temática Original:</strong> <span>{event.title}</span></p>
                            <p><strong>Fecha:</strong> <span>{moment(event.date || event.pro_fecha_formacion).format('LL')}</span></p>
                            <p><strong>Horario:</strong> <span>{`${moment(event.time, "HH:mm:ss").format('hh:mm A')} - ${moment(event.end_time, "HH:mm:ss").format('hh:mm A')}`}</span></p>
                            <p><strong>Horas a dictar:</strong> <span>{event.hours || event.pro_horas_dictar}</span></p>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title"><FaDollarSign /> Datos Financieros y Asignación</h3>
                        <div className="form-grid">
                            <div className="form-group"><label>Valor por Hora</label><input type="text" value={`$${(formData.valor_hora || 0).toLocaleString('es-CO')}`} readOnly /></div>
                            <div className="form-group"><label>Valor Total a Pagar</label><input type="text" value={`$${(formData.valor_total_horas || 0).toLocaleString('es-CO')}`} readOnly /></div>
                            <div className="form-group">
                                <label htmlFor="rr_id"><FaUserTie /> Responsable de Ruta *</label>
                                <select id="rr_id" name="rr_id" value={formData.rr_id} onChange={handleInputChange} required disabled={isReadOnly}>
                                    <option value="">-- Selecciona un responsable --</option>
                                    {responsables.map(r => (<option key={r.rr_id} value={r.rr_id}>{r.nombre_responsable} ({r.rut_nombre})</option>))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="section-title"><FaUsers /> Datos de la Ejecución</h3>
                        <div className="form-group full-width"><label htmlFor="tematica_dictada">Temática Dictada *</label><input type="text" id="tematica_dictada" name="tematica_dictada" value={formData.tematica_dictada} onChange={handleInputChange} required readOnly={isReadOnly} /></div>
                        {event.type === 'grupal' ? (
                            <div className="form-group full-width"><label htmlFor="numero_asistentes">Número de Asistentes *</label><input type="number" id="numero_asistentes" name="numero_asistentes" value={formData.numero_asistentes} onChange={handleInputChange} required readOnly={isReadOnly} /></div>
                        ) : (
                            <div className="form-grid">
                                <div className="form-group"><label htmlFor="razon_social">Razón Social *</label><input type="text" id="razon_social" name="razon_social" value={formData.razon_social} onChange={handleInputChange} required readOnly={isReadOnly} /></div>
                                <div className="form-group"><label htmlFor="nombre_asesorado">Nombre del Asesorado *</label><input type="text" id="nombre_asesorado" name="nombre_asesorado" value={formData.nombre_asesorado} onChange={handleInputChange} required readOnly={isReadOnly} /></div>
                                <div className="form-group"><label htmlFor="identificacion_asesorado">Identificación del Asesorado *</label><input type="number" id="identificacion_asesorado" name="identificacion_asesorado" value={formData.identificacion_asesorado} onChange={handleInputChange} required readOnly={isReadOnly} /></div>
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <h3 className="section-title"><FaFileUpload /> Archivos de Evidencia</h3>
                        {isReadOnly ? (
                            <div className="file-download-container">
                                <button type="button" className="file-download-link" onClick={() => handleDownload('principal')}><FaPaperclip /> Ver Evidencia Principal</button>
                                {event.type === 'individual' && (<button type="button" className="file-download-link" onClick={() => handleDownload('pantallazo')}><FaPaperclip /> Ver Pantallazo de Avanza</button>)}
                            </div>
                        ) : (
                            <>
                                <div className="form-group full-width">
                                    <label htmlFor="evi_evidencias" className="file-upload-label"><FaPaperclip /><span>Evidencia Principal (PDF, Fotos, etc.) {isEditMode ? '(Opcional si no la modificas)' : '*'}</span></label>
                                    {/* CORRECCIÓN 1: El atributo 'required' es condicional */}
                                    <input type="file" id="evi_evidencias" name="evi_evidencias" onChange={handleFileChange} required={!isEditMode} />
                                    {evidenciaFile && <span className="file-name-display"><FaCheckCircle /> {evidenciaFile.name}</span>}
                                </div>
                                {event.type === 'individual' && (
                                    <div className="form-group full-width">
                                        <label htmlFor="evi_pantallazo_avanza" className="file-upload-label"><FaPaperclip /><span>Pantallazo Plataforma Avanza {isEditMode ? '(Opcional si no lo modificas)' : '*'}</span></label>
                                        <input type="file" id="evi_pantallazo_avanza" name="evi_pantallazo_avanza" onChange={handleFileChange} required={!isEditMode} />
                                        {pantallazoFile && <span className="file-name-display"><FaCheckCircle /> {pantallazoFile.name}</span>}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {!isReadOnly && (
                        <button type="submit" className="submit-button" disabled={loading}>
                            <FaSave /> {loading ? 'Enviando...' : (isEditMode ? 'Reenviar Evidencia Corregida' : 'Guardar Evidencia')}
                        </button>
                    )}
                </form>
            </div>
        </ConsultorLayout>
    );
}

export default ConsultorEventDetailPage;