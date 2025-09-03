// src/pages/Gestora/GestoraConsultores.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import ConsultorItem from '../../components/ConsultorItem';
import './GestoraConsultores.css';
import apiService from '../../utils/api';

function GestoraConsultores() {
    const navigate = useNavigate();

    const [consultores, setConsultores] = useState([]);
    const [programaciones, setProgramaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortByEvents, setSortByEvents] = useState('none');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [consultoresRes, programacionesRes] = await Promise.all([
                    apiService.getAllConsultores(),
                    apiService.getProgramaciones() // Trae todas para el conteo general
                ]);

                if (consultoresRes.success) {
                    setConsultores(consultoresRes.data || []);
                } else {
                    throw new Error(consultoresRes.message || 'Error al cargar consultores');
                }

                if (programacionesRes.success) {
                    // Añadimos el instructor_cedula a cada programación para un conteo preciso
                    const programacionesConCedula = programacionesRes.data.programaciones.map(p => ({
                        ...p,
                        instructor_cedula: p.instructor_cedula || null 
                    }));
                    setProgramaciones(programacionesConCedula || []);
                } else {
                    throw new Error(programacionesRes.message || 'Error al cargar programaciones');
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const consultoresProcesados = useMemo(() => {
        const conteoEventos = {};
        programaciones.forEach(prog => {
            if (prog.instructor_cedula) {
                conteoEventos[prog.instructor_cedula] = (conteoEventos[prog.instructor_cedula] || 0) + 1;
            }
        });

        let lista = consultores.map(c => ({
            cedula: c.usu_cedula,
            nombre: c.nombre_completo,
            especialidad: c.especialidad || 'No especificada',
            contacto: { email: c.usu_correo, telefono: c.usu_telefono },
            eventos: conteoEventos[c.usu_cedula] || 0,
        }));

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            lista = lista.filter(c =>
                c.nombre.toLowerCase().includes(lower) ||
                c.especialidad.toLowerCase().includes(lower)
            );
        }

        if (sortByEvents === 'asc') {
            lista.sort((a, b) => a.eventos - b.eventos);
        } else if (sortByEvents === 'desc') {
            lista.sort((a, b) => b.eventos - a.eventos);
        }

        return lista;
    }, [consultores, programaciones, searchTerm, sortByEvents]);

    const handleViewDetails = (cedula) => {
        navigate(`/gestora/consultor/${cedula}`);
    };

    if (loading) return <DashboardLayout><div>Cargando directorio de consultores...</div></DashboardLayout>;
    if (error) return <DashboardLayout><div>Error: {error}</div></DashboardLayout>;


  return (
    <DashboardLayout>
       <h1>Directorio de Consultores</h1>

      <div className="consultores-list-section">
      <div className="section-header">
                    <h3>{consultoresProcesados.length} Consultores Encontrados</h3>
                    <Link to="/gestora/consultor/nuevo" className="new-consultor-button">
                        + Nuevo Consultor
                    </Link>
                </div>  

        <div className="filter-sort-controls">
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="filter-input"
          />
          <select
            value={sortByEvents}
            onChange={e => setSortByEvents(e.target.value)}
            className="sort-select"
          >
            <option value="none">Ordenar por Eventos</option>
            <option value="asc">Menos Eventos</option>
            <option value="desc">Más Eventos</option>
          </select>
        </div>

        <div className="list-header">
          <div className="header-cell name-col">NOMBRE</div>
          <div className="header-cell specialty-col">ESPECIALIDAD</div>
          <div className="header-cell contact-col">CONTACTO</div>
          <div className="header-cell events-col">EVENTOS</div>
          <div className="header-cell actions-col">ACCIONES</div>
        </div>

        <div className="consultores-list-container">
                    {consultoresProcesados.length > 0 ? (
                        consultoresProcesados.map(consultor => (
                            <ConsultorItem
                                key={consultor.cedula}
                                consultor={consultor}
                                // onEdit ahora es onSelect o onViewDetails
                                onEdit={() => handleViewDetails(consultor.cedula)}
                                // La eliminación de un perfil es una acción delicada,
                                // es mejor hacerla desde la página de detalle.
                                onDelete={null} 
                            />
                        ))
                    ) : (
                        <div className="no-consultores-message">
                            No se encontraron consultores.
                        </div>
                    )}
                </div>
            </div>
    </DashboardLayout>
  );
}

export default GestoraConsultores;
