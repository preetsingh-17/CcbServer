import React, { useState, useEffect } from 'react';
import './CronogramaAlerts.css';
import apiService from '../utils/api';

const CronogramaAlerts = ({ userRole = 'Profesional' }) => {
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        cargarAlertas();
        
        // Actualizar cada 5 minutos
        const interval = setInterval(cargarAlertas, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const cargarAlertas = async () => {
        try {
            setError(null);
            const response = await apiService.getProximasAlertasCCB();
            
            if (response.success) {
                setAlertas(response.data);
            } else {
                throw new Error(response.message || 'Error al cargar alertas');
            }
        } catch (err) {
            console.error('Error cargando alertas del cronograma:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getColorClass = (color) => {
        switch (color) {
            case 'red': return 'cronograma-alert-urgent';
            case 'orange': return 'cronograma-alert-warning';
            case 'yellow': return 'cronograma-alert-info';
            default: return 'cronograma-alert-normal';
        }
    };

    const getIconByColor = (color) => {
        switch (color) {
            case 'red': return '🚨';
            case 'orange': return '⚠️';
            case 'yellow': return '📋';
            default: return '📅';
        }
    };

    if (loading) {
        return (
            <div className="cronograma-alerts-container">
                <div className="cronograma-alerts-header">
                    <h3>📅 Cronograma CCB</h3>
                </div>
                <div className="cronograma-alerts-loading">
                    <div className="loading-spinner"></div>
                    <span>Cargando alertas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cronograma-alerts-container">
                <div className="cronograma-alerts-header">
                    <h3>📅 Cronograma CCB</h3>
                </div>
                <div className="cronograma-alerts-error">
                    <span>❌ Error: {error}</span>
                    <button onClick={cargarAlertas} className="retry-button">
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (alertas.length === 0) {
        return (
            <div className="cronograma-alerts-container">
                <div className="cronograma-alerts-header">
                    <h3>📅 Cronograma CCB</h3>
                </div>
                <div className="cronograma-alerts-empty">
                    <span>✅ No hay alertas urgentes</span>
                    <small>Todas las fechas límite están en orden</small>
                </div>
            </div>
        );
    }

    // Mostrar solo la alerta más urgente por defecto
    const alertaMasUrgente = alertas[0];
    const alertasRestantes = alertas.slice(1);

    return (
        <div className="cronograma-alerts-container">
            <div className="cronograma-alerts-header">
                <h3>📅 Cronograma CCB</h3>
                <span className="cronograma-alert-count">
                    {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Alerta principal (más urgente) */}
            <div className={`cronograma-alert-item ${getColorClass(alertaMasUrgente.color_urgencia)}`}>
                <div className="cronograma-alert-content">
                    <span className="cronograma-alert-icon">
                        {getIconByColor(alertaMasUrgente.color_urgencia)}
                    </span>
                    <div className="cronograma-alert-text">
                        <div className="cronograma-alert-message">
                            {alertaMasUrgente.alerta_urgente}
                        </div>
                        <div className="cronograma-alert-meta">
                            Mes: {alertaMasUrgente.mes_ejecucion}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas adicionales (colapsibles) */}
            {alertasRestantes.length > 0 && (
                <>
                    <button 
                        className="cronograma-expand-button"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '🔽' : '▶️'} Ver {alertasRestantes.length} alerta{alertasRestantes.length !== 1 ? 's' : ''} más
                    </button>

                    {isExpanded && (
                        <div className="cronograma-alerts-expanded">
                            {alertasRestantes.map((alerta, index) => (
                                <div 
                                    key={index + 1}
                                    className={`cronograma-alert-item ${getColorClass(alerta.color_urgencia)} cronograma-alert-secondary`}
                                >
                                    <div className="cronograma-alert-content">
                                        <span className="cronograma-alert-icon">
                                            {getIconByColor(alerta.color_urgencia)}
                                        </span>
                                        <div className="cronograma-alert-text">
                                            <div className="cronograma-alert-message">
                                                {alerta.alerta_urgente}
                                            </div>
                                            <div className="cronograma-alert-meta">
                                                Mes: {alerta.mes_ejecucion}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Footer con opción de recargar */}
            <div className="cronograma-alerts-footer">
                <button 
                    onClick={cargarAlertas} 
                    className="cronograma-refresh-button"
                    title="Actualizar alertas"
                >
                    🔄
                </button>
                <small className="cronograma-last-update">
                    Actualizado: {new Date().toLocaleTimeString()}
                </small>
            </div>
        </div>
    );
};

export default CronogramaAlerts; 