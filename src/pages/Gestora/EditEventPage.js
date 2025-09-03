// src/pages/Gestora/EditEventPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import './EditEventPage.css';
import apiService from '../../utils/api';

function EditEventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!eventId;

  // Estado para manejar todos los campos del formulario.
  // Los nombres coinciden con lo que espera el backend.
  const [formData, setFormData] = useState({
    // Campos comunes
    pr_id: '',
    act_id: '',
    mod_id: '',
    oamp: '',
    val_reg_id: null,
    pro_tematica: '', // Reemplaza a 'title'
    pro_fecha_formacion: '', // Reemplaza a 'date'
    pro_hora_inicio: '', // Reemplaza a 'time'
    pro_hora_fin: '', // Reemplaza a 'endTime'
    pro_horas_dictar: 0,
    pro_direccion: '', // Reemplaza a 'location'
    pro_enlace: '',
    pro_observaciones: '',
    pro_estado: 'Programado', // Reemplaza a 'status'
    
    // Campos específicos para individuales
    proin_nombre_empresario: '',
    proin_identificacion_empresario: ''
    // Agrega aquí cualquier otro campo que necesites del backend
  });

  const [eventType, setEventType] = useState(null); // 'grupal' o 'individual'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. CARGAR DATOS DESDE LA API AL MONTAR EL COMPONENTE
  useEffect(() => {
    if (!isEditing) {
      setLoading(false);
      return; // Salimos si es un evento nuevo
    }

    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProgramacionById(eventId);

        if (response.success) {
          const { programacion, tipo } = response.data;
          
          // Mapeamos los datos del backend al estado del formulario
          const eventData = tipo === 'grupal' ? programacion : programacion;
          
          setFormData({
            pr_id: eventData.pr_id,
            act_id: eventData.act_id,
            mod_id: eventData.mod_id,
            oamp: eventData.oamp,
            val_reg_id: eventData.val_reg_id,
            pro_tematica: eventData.pro_tematica || eventData.proin_tematica,
            pro_fecha_formacion: (eventData.pro_fecha_formacion || eventData.proin_fecha_formacion).split('T')[0],
            pro_hora_inicio: eventData.pro_hora_inicio || eventData.proin_hora_inicio,
            pro_hora_fin: eventData.pro_hora_fin || eventData.proin_hora_fin,
            pro_horas_dictar: eventData.pro_horas_dictar || eventData.proin_horas_dictar,
            pro_direccion: eventData.pro_direccion || eventData.proin_direccion,
            pro_enlace: eventData.pro_enlace || eventData.proin_enlace,
            pro_observaciones: eventData.pro_observaciones || eventData.proin_observaciones,
            pro_estado: eventData.pro_estado || eventData.proin_estado,
            proin_nombre_empresario: eventData.proin_nombre_empresario || '',
            proin_identificacion_empresario: eventData.proin_identificacion_empresario || ''
          });

          setEventType(tipo);
        } else {
          setError(response.message || 'Error al cargar el evento.');
        }
      } catch (err) {
        setError('No se pudo conectar con el servidor.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. ENVIAR DATOS A LA API AL GUARDAR
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing) return; // Por ahora, solo manejamos edición

    try {
      // Usamos el método `updateProgramacion` que creamos en api.js
      const response = await apiService.updateProgramacion(eventId, formData);

      if (response.success) {
        alert('Evento actualizado exitosamente en la base de datos.');
        navigate('/gestora/eventos');
      } else {
        alert(`Error al actualizar: ${response.message}`);
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      alert('Ocurrió un error de conexión.');
    }
  };

  // 3. ELIMINAR EVENTO DESDE LA API
  const handleDelete = async () => {
    if (isEditing && window.confirm(`¿Seguro que quieres eliminar "${formData.pro_tematica}"?`)) {
      try {
        const response = await apiService.deleteProgramacion(eventId);
        if (response.success) {
          alert('Evento eliminado de la base de datos.');
          navigate('/gestora/eventos');
        } else {
          alert(`Error al eliminar: ${response.message}`);
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Ocurrió un error de conexión.');
      }
    }
  };

  if (loading) return <DashboardLayout><div>Cargando datos del evento...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div>Error: {error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1>{isEditing ? `Editando Evento ${eventType === 'individual' ? 'Individual' : 'Grupal'}` : 'Nuevo Evento'}</h1>
      <form className="event-form" onSubmit={handleSubmit}>
        
        {/* Los `name` de los inputs ahora coinciden con el estado y el backend */}
        <div className="form-group">
          <label htmlFor="pro_tematica">Temática:</label>
          <input type="text" id="pro_tematica" name="pro_tematica" value={formData.pro_tematica} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="pro_fecha_formacion">Fecha:</label>
          <input type="date" id="pro_fecha_formacion" name="pro_fecha_formacion" value={formData.pro_fecha_formacion} onChange={handleInputChange} required />
        </div>
        
        <div className="form-group">
          <label htmlFor="pro_hora_inicio">Hora de Inicio:</label>
          <input type="time" id="pro_hora_inicio" name="pro_hora_inicio" value={formData.pro_hora_inicio} onChange={handleInputChange} required />
        </div>
        
        <div className="form-group">
          <label htmlFor="pro_hora_fin">Hora de Fin:</label>
          <input type="time" id="pro_hora_fin" name="pro_hora_fin" value={formData.pro_hora_fin} onChange={handleInputChange} required />
        </div>

        {/* Campos que solo aparecen si el evento es de tipo 'individual' */}
        {eventType === 'individual' && (
          <>
            <div className="form-group">
              <label htmlFor="proin_nombre_empresario">Nombre Empresario:</label>
              <input type="text" id="proin_nombre_empresario" name="proin_nombre_empresario" value={formData.proin_nombre_empresario} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="proin_identificacion_empresario">Identificación Empresario:</label>
              <input type="text" id="proin_identificacion_empresario" name="proin_identificacion_empresario" value={formData.proin_identificacion_empresario} onChange={handleInputChange} />
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={!isEditing}>Guardar Cambios</button>
          {isEditing && (<button type="button" className="delete-button" onClick={handleDelete}>Eliminar</button>)}
          <button type="button" className="cancel-button" onClick={() => navigate('/gestora/eventos')}>Cancelar</button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default EditEventPage;