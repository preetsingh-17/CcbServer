// src/pages/Gestora/ConsultorCrearPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './ConsultorCrearPage.css';
import apiService from '../../utils/api';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaFileAlt, FaSave, FaTimes, FaBriefcase, FaBuilding } from 'react-icons/fa';

function ConsultorCrearPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        // Perfil
        usu_cedula: '',
        usu_primer_nombre: '',
        usu_segundo_nombre: '',
        usu_primer_apellido: '',
        usu_segundo_apellido: '',
        usu_telefono: '',
        usu_direccion: '',
        are_id: '',
        // Cuenta
        usu_correo: '',
        usu_contraseña: '',
        // Contrato
        oamp: '',
        oamp_consecutivo: '',
        oamp_valor_total: '',
        // Asignación
        gc_observaciones: ''
    });
    
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const res = await apiService.getAreasConocimiento();
                if (res.success) {
                    setAreas(res.data);
                } else {
                    throw new Error(res.message);
                }
            } catch (err) {
                setError("No se pudieron cargar las especialidades.");
            } finally {
                setLoading(false);
            }
        };
        fetchAreas();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.usu_correo || !formData.usu_contraseña || !formData.usu_cedula || !formData.usu_primer_nombre) {
            setError('Por favor, completa los campos obligatorios (*).');
            return;
        }
        
        setLoading(true);
        try {
            const result = await apiService.createConsultorCompleto(formData);
            if (result.success) {
                alert('Consultor creado y asignado exitosamente.');
                navigate('/gestora/consultores');
            } else {
                setError(result.message || 'Ocurrió un error.');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <DashboardLayout>
            <div className="consultor-crear-container">
                <div className="page-header">
                    <h1>Crear Nuevo Consultor</h1>
                    <Link to="/gestora/consultores" className="cancel-button">
                        <FaTimes /> Cancelar y Volver
                    </Link>
                </div>
                
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="consultor-crear-form">
                    <div className="form-section">
                        <h3><FaUser /> Información Personal</h3>
                        <div className="form-grid">
                            {/* Fila 1 */}
                            <div className="form-group"><label htmlFor="usu_primer_nombre">Primer Nombre *</label><input id="usu_primer_nombre" name="usu_primer_nombre" value={formData.usu_primer_nombre} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="usu_segundo_nombre">Segundo Nombre</label><input id="usu_segundo_nombre" name="usu_segundo_nombre" value={formData.usu_segundo_nombre} onChange={handleInputChange} /></div>
                            {/* Fila 2 */}
                            <div className="form-group"><label htmlFor="usu_primer_apellido">Primer Apellido *</label><input id="usu_primer_apellido" name="usu_primer_apellido" value={formData.usu_primer_apellido} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="usu_segundo_apellido">Segundo Apellido</label><input id="usu_segundo_apellido" name="usu_segundo_apellido" value={formData.usu_segundo_apellido} onChange={handleInputChange} /></div>
                            {/* Fila 3 */}
                             <div className="form-group"><label htmlFor="usu_cedula">Cédula *</label><input type="number" id="usu_cedula" name="usu_cedula" value={formData.usu_cedula} onChange={handleInputChange} required /></div>
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <h3><FaEnvelope /> Credenciales y Contacto</h3>
                        <div className="form-grid">
                            <div className="form-group"><label htmlFor="usu_correo">Correo Electrónico *</label><input type="email" id="usu_correo" name="usu_correo" value={formData.usu_correo} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="usu_contraseña">Contraseña *</label><input type="password" id="usu_contraseña" name="usu_contraseña" value={formData.usu_contraseña} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="usu_telefono"><FaPhone /> Teléfono</label><input type="tel" id="usu_telefono" name="usu_telefono" value={formData.usu_telefono} onChange={handleInputChange} /></div>
                             <div className="form-group"><label htmlFor="usu_direccion"><FaMapMarkerAlt /> Dirección</label><input type="text" id="usu_direccion" name="usu_direccion" value={formData.usu_direccion} onChange={handleInputChange} /></div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><FaBriefcase /> Información del Contrato</h3>
                        <div className="form-grid">
                            <div className="form-group"><label htmlFor="oamp">OAMP (Número de Contrato) *</label><input type="number" id="oamp" name="oamp" value={formData.oamp} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="oamp_consecutivo">Consecutivo OAMP *</label><input type="text" id="oamp_consecutivo" name="oamp_consecutivo" value={formData.oamp_consecutivo} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label htmlFor="oamp_valor_total">Valor Total Contrato</label><input type="number" id="oamp_valor_total" name="oamp_valor_total" value={formData.oamp_valor_total} onChange={handleInputChange} /></div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3><FaBuilding /> Asignación</h3>
                        <div className="form-group full-width">
                            <label htmlFor="gc_observaciones">Observaciones de Asignación</label>
                            <textarea id="gc_observaciones" name="gc_observaciones" value={formData.gc_observaciones} onChange={handleInputChange} rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <h3><FaFileAlt /> Especialidad</h3>
                         <div className="form-group full-width">
                            <label htmlFor="are_id">Área de Conocimiento / Especialidad *</label>
                            <select id="are_id" name="are_id" value={formData.are_id} onChange={handleInputChange} required>
                                <option value="">-- Selecciona un área --</option>
                                {areas.map(area => (
                                    <option key={area.are_id} value={area.are_id}>{area.are_descripcion}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-button" disabled={loading}>
                            <FaSave /> {loading ? 'Creando...' : 'Crear Consultor'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

export default ConsultorCrearPage;