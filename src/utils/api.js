// Servicio de API para conectar con el backend MySQL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Obtener token del localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Headers por defecto
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Método base para peticiones
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en API:', error);
      throw error;
    }
  }

  // Métodos de autenticación
  async login(username, password, selectedRole) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, selectedRole }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify', {
      method: 'POST',
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Métodos para consultores
  async getConsultores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/consultores${queryString ? `?${queryString}` : ''}`);
  }

   // Para la lista de todos los consultores
   async getAllConsultores() {
    return this.request('/usuarios/tipo/consultor');
}
// Para obtener los detalles de un solo consultor por su cédula
async getConsultorByCedula(cedula) {
  return this.request(`/usuarios/cedula/${cedula}`);
}

// Para obtener los eventos de un solo consultor
async getProgramacionesByConsultor(consultorCedula) {
  return this.request(`/programaciones?consultorCedula=${consultorCedula}`);
}
  async getConsultor(id) {
    return this.request(`/consultores/${id}`);
  }
  async getAreasConocimiento() {
    return this.request('/areas-conocimiento');
}

async createConsultorCompleto(formData) {
    return this.request('/usuarios/completo/consultor', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
}

  async createConsultor(consultorData) {
    return this.request('/consultores', {
      method: 'POST',
      body: JSON.stringify(consultorData),
    });
  }

  async updateConsultor(id, consultorData) {
    return this.request(`/consultores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consultorData),
    });
  }

  async deleteConsultor(id) {
    return this.request(`/consultores/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para eventos
  async getEventos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/eventos${queryString ? `?${queryString}` : ''}`);
  }

  async createEvento(eventoData) {
    return this.request('/eventos', {
      method: 'POST',
      body: JSON.stringify(eventoData),
    });
  }

  // Métodos para pagos
  async getPagos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/pagos${queryString ? `?${queryString}` : ''}`);
  }

  // Métodos para evidencias
  async getEvidencias(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/evidencias${queryString ? `?${queryString}` : ''}`);
  }

  // Métodos para vacantes
  async getVacantes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vacantes${queryString ? `?${queryString}` : ''}`);
  }

  // ========== MÉTODOS PARA PROGRAMACIONES ==========

  // Obtener todas las programaciones (grupales e individuales)
  async getProgramaciones(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/programaciones${queryString ? `?${queryString}` : ''}`);
  }

  async getProgramacionById(id) {
    return this.request(`/programaciones/${id}`);
  }

  // Obtener estadísticas para el dashboard
  async getDashboardStats() {
    return this.request('/programaciones/dashboard-stats');
  }

  // ========== MÉTODOS PARA GESTORAS (NUEVO) ==========

  async getConsultoresAsignados(gestoraCedula) {
    return this.request(`/gestores/consultores/${gestoraCedula}`);
}

  // Obtener actividades (talleres, asesorías grupales, individuales)
  async getActividades() {
    return this.request('/programaciones/actividades');
  }

  // Obtener modalidades (virtual, presencial, híbrido)
  async getModalidades() {
    return this.request('/programaciones/modalidades');
  }

  // Obtener programas con sus rutas
  async getProgramaRutas() {
    return this.request('/programaciones/programa-rutas');
  }

  // Obtener regiones con valores de horas
  async getRegiones() {
    return this.request('/programaciones/regiones');
  }

  // Obtener municipios por región
  async getMunicipiosByRegion(regionId) {
    return this.request(`/programaciones/municipios/${regionId}`);
  }

  // Obtener contratos disponibles
  async getContratos(gestoraCedula) {
    return this.request(`/programaciones/contratos?gestoraCedula=${gestoraCedula}`);
  }

  // Debug: Obtener información específica de un consultor
  async debugConsultor(cedula) {
    return this.request(`/programaciones/debug-consultor/${cedula}`);
  }

  // Calcular valores de una ruta específica
  async calcularValoresRuta(pr_id, val_reg_id, mod_id, horas_dictar) {
    const params = new URLSearchParams({
      pr_id,
      horas_dictar
    });
    
    if (val_reg_id && val_reg_id !== 'null' && val_reg_id !== '') {
      params.append('val_reg_id', val_reg_id);
    }
    
    if (mod_id && mod_id !== 'null' && mod_id !== '') {
      params.append('mod_id', mod_id);
    }
    
    return this.request(`/programaciones/calcular-valores?${params.toString()}`);
  }

  // Crear programación grupal (talleres, asesorías grupales, cápsulas)
  async createProgramacionGrupal(programacionData) {
    return this.request('/programaciones/grupal', {
      method: 'POST',
      body: JSON.stringify(programacionData),
    });
  }

  // Crear programación individual (asesorías individuales)
  async createProgramacionIndividual(programacionData) {
    return this.request('/programaciones/individual', {
      method: 'POST',
      body: JSON.stringify(programacionData),
    });
  }

  // Obtener una programación específica para edición
  async getProgramacion(id) {
    return this.request(`/programaciones/${id}`);
  }

  // Eliminar programación
  async deleteProgramacion(id) {
    return this.request(`/programaciones/${id}`, {
      method: 'DELETE',
    });
  }

  // Actualizar programación
  async updateProgramacion(id, programacionData) {
    return this.request(`/programaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(programacionData),
    });
  }

  // Método para probar conexión
  async testConnection() {
    return this.request('/health');
  }

  async testDatabase() {
    return this.request('/test-db');
  }
  // ========== MÉTODOS PARA LOS INFORMES (NUEVO) ==========

  // Renombramos la función para mayor claridad
  async generarInformePorRuta(rutaId) {
    // Llama al nuevo endpoint con el ID en la URL
    return this.request(`/informes/por-ruta/${rutaId}`);
}

  // ========== MÉTODOS PARA CONSULTORES (EVIDENCIAS) ==========
  // Nota: Para subir archivos, no se usa JSON, se usa FormData.
  // El header 'Content-Type' es establecido automáticamente por el navegador.
  // NEW: Method to get feedback
  async getEvidenceFeedback(tipo, programacionId) {
    const numericId = programacionId.split('_')[1];
    return this.request(`/evidencias/feedback/${tipo}/${numericId}`);
}

// NEW: Method to update (edit) an evidence
async updateEvidence(tipo, programacionId, formData) {
    const numericId = programacionId.split('_')[1];
    const url = `${this.baseURL}/evidencias/editar/${tipo}/${numericId}`;
    const token = this.getToken();

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // No 'Content-Type' header here, FormData sets it automatically
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al actualizar la evidencia');
        }
        return data;
    } catch (error) {
        console.error('Error en API (updateEvidence):', error);
        throw error;
    }
}
  async uploadEvidence(formData) {
    const url = `${this.baseURL}/evidencias/cargar`;
    const token = this.getToken();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // No establezcas 'Content-Type': 'application/json'
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error en la subida');
        }
        return data;
    } catch (error) {
        console.error('Error en API (upload):', error);
        throw error;
    }
  }

  async getResponsablesRuta() {
    return this.request('/responsables');
  }

  async getEvidence(programacionId){
    return this.request(`/evidencias/${programacionId}`);
  }

  // --- INICIO DE LA NUEVA FUNCIÓN DE DESCARGA ---
  async downloadFile(endpoint) {
    const url = `${this.baseURL}${endpoint}`;
    try {
        // Usamos getHeaders para la autenticación, pero eliminamos Content-Type
        const headers = this.getHeaders();
        delete headers['Content-Type'];

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo descargar el archivo.');
        }

        const disposition = response.headers.get('content-disposition');
        let filename = 'archivo-descargado';
        if (disposition && disposition.includes('attachment')) {
            const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }
        
        const blob = await response.blob();
        return { blob, filename };

    } catch (error) {
        console.error('Error en API (downloadFile):', error);
        throw error;
    }
  }

  // Nuevo método para obtener los datos del dashboard
  async getDashboardData() {
    return this.request('/dashboard/data');
}
// ========== MÉTODOS PARA GESTIÓN DE EVIDENCIAS (PROFESIONAL) ==========

getEvidenciasParaProfesional() {
  // Llama al nuevo endpoint que creamos
  return this.request('/evidencias-profesional');
}

submitFeedback(data) {
  // data = { tipo_evidencia: 'grupal' | 'individual', id: 1, feedback: '...' }
  return this.request('/evidencias-profesional/valoracion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

confirmarEvidencias(data) {
   // data = { tipo_evidencia: 'grupal' | 'individual', id: 1 }
  return this.request('/evidencias-profesional/confirmar', {
      method: 'PUT',
      body: JSON.stringify(data),
  });
}

  // === CRONOGRAMA CCB ===
  // Obtener fechas límite del cronograma CCB
  async getFechasLimiteCCB() {
    return this.request('/cronograma/fechas-limite');
  }

  // Obtener próximas alertas del cronograma CCB
  async getProximasAlertasCCB() {
    return this.request('/cronograma/proximas-alertas');
  }

  // Obtener estado del scheduler de cronograma
  async getSchedulerStatus() {
    return this.request('/cronograma/scheduler/status');
  }

  // Ejecutar scheduler manualmente
  async ejecutarScheduler() {
    return this.request('/cronograma/scheduler/ejecutar', {
      method: 'POST'
    });
  }
  // ========== MÉTODOS PARA INFORMES POR PROGRAMA ==========

  // Método para obtener lista de programas disponibles
  async obtenerProgramas() {
    try {
      return this.request('/informes/programas');
    } catch (error) {
      console.error('Error al obtener programas:', error);
      throw error;
    }
  }

  // Método para generar informe por programa
  async generarInformePorPrograma(programaId, filtros = {}) {
    try {
      // Construir parámetros de consulta
      const queryParams = new URLSearchParams();
      
      if (filtros.mes) queryParams.append('mes', filtros.mes);
      if (filtros.año) queryParams.append('año', filtros.año);
      if (filtros.gestoraCedula) queryParams.append('gestoraCedula', filtros.gestoraCedula);

      const endpoint = `/informes/por-programa/${programaId}`;
      const finalEndpoint = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

      return this.request(finalEndpoint);
    } catch (error) {
      console.error('Error al generar informe por programa:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const apiService = new ApiService();
export default apiService; 