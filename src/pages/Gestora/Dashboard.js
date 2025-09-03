import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import CronogramaAlerts from '../../components/CronogramaAlerts';
import './Dashboard.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import apiService from '../../utils/api'; // Importar el servicio de API

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Funciones de Ayuda ---
const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return '$0';
        value = parsed;
    }
    return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatNumber = (value) => {
    if (typeof value !== 'number') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) return '0';
        value = parsed;
    }
    return value.toLocaleString('es-CO');
};


// --- Componente Principal del Dashboard ---
function Dashboard() {
    // Estados para los datos, la carga y la selección
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedProgramaId, setSelectedProgramaId] = useState('general');
    const [selectedRutaId, setSelectedRutaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Los botones de navegación principales siguen siendo estáticos para mantener el orden y los iconos
    const programasPrincipales = useMemo(() => [
        { id: 'general', name: 'Vista General', icon: '📊' },
        { id: '1', name: 'Crecimiento Empresarial', icon: '📈' },
        { id: '2', name: 'Emprendimiento', icon: '🚀' },
        { id: '3', name: 'Consolidación y Escalamiento', icon: '🏢' },
        { id: '4', name: 'Foro Presidente', icon: '🗣️' }
    ], []);

    // Efecto para cargar los datos desde la API cuando el componente se monta
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.getDashboardData();
                if (response.success) {
                    setDashboardData(response.data);
                } else {
                    throw new Error(response.message || 'No se pudieron cargar los datos.');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Efecto para el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleProgramaChange = (programaId) => {
        setSelectedProgramaId(programaId);
        setSelectedRutaId(null); // Resetea la ruta al cambiar de programa
    };

    const renderContent = () => {
        // Si no hay datos, no renderizar nada
        if (!dashboardData) return null;

        const currentProgramaData = dashboardData[selectedProgramaId];
        if (!currentProgramaData) return <p>Seleccione un programa.</p>;

        const isRutaSelected = selectedRutaId && currentProgramaData.rutas;
        const currentRutaData = isRutaSelected ? currentProgramaData.rutas.find(r => r.id === selectedRutaId) : null;

        // Formatear los datos de las tarjetas de estadísticas
        const formatStats = (stats) => stats.map(stat => ({
            ...stat,
            value: stat.title.toLowerCase().includes('valor') ? formatCurrency(stat.value) : formatNumber(stat.value)
        }));

        // La data a mostrar viene de la RUTA seleccionada, o del PROGRAMA si no hay ruta.
        // Para el programa, construimos las tarjetas de estadísticas al vuelo.
        const displayData = currentRutaData ? {
            ...currentRutaData,
            stats: formatStats(currentRutaData.stats)
        } : {
            stats: formatStats([
                { title: 'Total Horas Programa', value: currentProgramaData.programStats.total_horas_propuesta },
                { title: 'Horas Ejecutadas', value: currentProgramaData.programStats.horas_ejecutadas },
                { title: 'Valor Ejecutado', value: currentProgramaData.programStats.valor_ejecutado },
                { title: 'Nº Rutas', value: currentProgramaData.rutas.length }
            ]),
            barData: currentProgramaData.programBarData,
            doughnutData: currentProgramaData.programDoughnutData,
        };

        if (selectedProgramaId === 'general') {
            displayData.stats = formatStats(currentProgramaData.programStats);
        }

        if (!displayData || !displayData.stats) return <p>Cargando datos...</p>;

        return (
            <div className="section-content">
                {selectedProgramaId !== 'general' && currentProgramaData.rutas.length > 0 && (
                    <div className="ruta-navigation">
                        <h4>Rutas del Programa: {currentProgramaData.name}</h4>
                        <div className="ruta-buttons-container">
                            {currentProgramaData.rutas.map(ruta => (
                                <button
                                    key={ruta.id}
                                    className={`ruta-button ${selectedRutaId === ruta.id ? 'active' : ''}`}
                                    onClick={() => setSelectedRutaId(ruta.id)}
                                >
                                    {ruta.name}
                                </button>
                            ))}
                            {selectedRutaId && (
                                <button className="ruta-button" onClick={() => setSelectedRutaId(null)}>
                                    Ver Resumen del Programa
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="dashboard-stats">
                    {displayData.stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <h3>{stat.title}</h3>
                            <p>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {displayData.areaConocimiento && (
                    <div className="area-conocimiento-card">
                        <h4>Área(s) de Conocimiento Principal(es)</h4>
                        <p>{displayData.areaConocimiento}</p>
                    </div>
                )}

                <div className="charts-grid">
                    {displayData.barData && (
                        <div className="chart-container">
                            <h3>{displayData.barData.datasets[0].label || 'Análisis Principal'}</h3>
                            <div className="chart-wrapper">
                                <Bar data={displayData.barData} options={chartOptions} />
                            </div>
                        </div>
                    )}
                    {displayData.doughnutData && (
                        <div className="chart-container">
                            <h3>Progreso General de Horas</h3>
                            <div className="chart-wrapper">
                                <Doughnut data={displayData.doughnutData} options={doughnutOptions} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: isMobile ? 'bottom' : 'top' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: ${formatNumber(c.parsed.y)}` } } }, scales: { y: { ticks: { callback: (v) => formatNumber(v) } } } };
    const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => `${c.label || ''}: ${formatNumber(c.parsed)}` } } }, cutout: '65%' };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando datos del dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }
    
    if (error) {
        return (
            <DashboardLayout>
                <div className="error-message">Error: {error}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h1>Panel de Control CCB - Propuesta Ejecución</h1>
                </div>
                
                {/* Alertas del Cronograma CCB */}
                <CronogramaAlerts />
                
                <div className="dashboard-navigation">
                    {programasPrincipales.map(prog => (
                        <button key={prog.id} className={`nav-button ${selectedProgramaId === prog.id ? 'active' : ''}`} onClick={() => handleProgramaChange(prog.id)}>
                            <span className="nav-icon">{prog.icon}</span>
                            <span>{prog.name}</span>
                        </button>
                    ))}
                </div>
                {renderContent()}
            </div>
        </DashboardLayout>
    );
}

export default Dashboard;
