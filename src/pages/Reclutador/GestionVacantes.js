import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GestionVacantes.css';

const vacantesIniciales = [
  {
    id: 1,
    titulo: 'Consultor Senior de Innovación',
    area: 'Innovación',
    tipo: 'Tiempo Completo',
    ubicacion: 'Bogotá, Colombia',
    modalidad: 'Híbrido',
    experiencia: '5+ años',
    descripcion: 'Buscamos un consultor senior con experiencia en gestión de innovación y transformación empresarial para liderar proyectos estratégicos con nuestros clientes.',
    requisitos: [
      'Experiencia demostrable en consultoría de innovación',
      'Conocimiento en metodologías ágiles y Design Thinking',
      'Habilidades de liderazgo y gestión de equipos',
      'Excelentes habilidades de comunicación'
    ],
    skills: ['Innovación', 'Gestión de Proyectos', 'Design Thinking', 'Liderazgo'],
    salario: '$8,000,000 - $12,000,000',
    fecha_publicacion: '2024-03-20',
    estado: 'Activa',
    postulaciones: 12
  }
];

function GestionVacantes() {
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState(vacantesIniciales);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [nuevaVacante, setNuevaVacante] = useState({
    titulo: '',
    area: '',
    tipo: '',
    ubicacion: '',
    modalidad: '',
    experiencia: '',
    descripcion: '',
    requisitos: [],
    skills: [],
    salario: '',
    estado: 'Activa'
  });

  const areas = [
    'Innovación',
    'Emprendimiento',
    'Desarrollo Empresarial',
    'Transformación Digital',
    'Sostenibilidad',
    'Marketing y Ventas'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const vacanteConId = {
      ...nuevaVacante,
      id: vacantes.length + 1,
      fecha_publicacion: new Date().toISOString().split('T')[0],
      postulaciones: 0
    };
    setVacantes([...vacantes, vacanteConId]);
    setMostrarFormulario(false);
    setNuevaVacante({
      titulo: '',
      area: '',
      tipo: '',
      ubicacion: '',
      modalidad: '',
      experiencia: '',
      descripcion: '',
      requisitos: [],
      skills: [],
      salario: '',
      estado: 'Activa'
    });
  };

  const handleRequisitosChange = (e) => {
    const requisitos = e.target.value.split('\n').filter(req => req.trim() !== '');
    setNuevaVacante({...nuevaVacante, requisitos});
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setNuevaVacante({...nuevaVacante, skills});
  };

  const filtrarVacantes = () => {
    return vacantes.filter(vacante => {
      const cumpleEstado = !filtroEstado || vacante.estado === filtroEstado;
      const cumpleArea = !filtroArea || vacante.area === filtroArea;
      return cumpleEstado && cumpleArea;
    });
  };

  const verPostulaciones = (e, vacanteId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navegando a postulaciones de vacante:', vacanteId);
    navigate(`/reclutador/vacantes/${vacanteId}/postulaciones`);
  };

  return (
    <div className="gestion-vacantes">
      <div className="header-acciones">
        <div className="titulo-seccion">
          <h2>Gestión de Vacantes</h2>
          <p>Administra las vacantes para consultores de la CCB</p>
        </div>
        <button 
          className="btn-crear-vacante"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <i className="fas fa-plus"></i>
          {mostrarFormulario ? 'Cancelar' : 'Crear Nueva Vacante'}
        </button>
      </div>

      {mostrarFormulario && (
        <form className="formulario-vacante" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Título de la Vacante *</label>
              <input
                type="text"
                required
                value={nuevaVacante.titulo}
                onChange={(e) => setNuevaVacante({...nuevaVacante, titulo: e.target.value})}
                placeholder="Ej: Consultor Senior de Innovación"
              />
            </div>

            <div className="form-group">
              <label>Área *</label>
              <select
                required
                value={nuevaVacante.area}
                onChange={(e) => setNuevaVacante({...nuevaVacante, area: e.target.value})}
              >
                <option value="">Seleccionar área...</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Contrato *</label>
              <select
                required
                value={nuevaVacante.tipo}
                onChange={(e) => setNuevaVacante({...nuevaVacante, tipo: e.target.value})}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="Tiempo Completo">Tiempo Completo</option>
                <option value="Medio Tiempo">Medio Tiempo</option>
                <option value="Por Proyecto">Por Proyecto</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ubicación *</label>
              <input
                type="text"
                required
                value={nuevaVacante.ubicacion}
                onChange={(e) => setNuevaVacante({...nuevaVacante, ubicacion: e.target.value})}
                placeholder="Ej: Bogotá, Colombia"
              />
            </div>

            <div className="form-group">
              <label>Modalidad *</label>
              <select
                required
                value={nuevaVacante.modalidad}
                onChange={(e) => setNuevaVacante({...nuevaVacante, modalidad: e.target.value})}
              >
                <option value="">Seleccionar modalidad...</option>
                <option value="Presencial">Presencial</option>
                <option value="Remoto">Remoto</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>

            <div className="form-group">
              <label>Experiencia Requerida *</label>
              <input
                type="text"
                required
                value={nuevaVacante.experiencia}
                onChange={(e) => setNuevaVacante({...nuevaVacante, experiencia: e.target.value})}
                placeholder="Ej: 5+ años"
              />
            </div>

            <div className="form-group">
              <label>Rango Salarial *</label>
              <input
                type="text"
                required
                value={nuevaVacante.salario}
                onChange={(e) => setNuevaVacante({...nuevaVacante, salario: e.target.value})}
                placeholder="Ej: $8,000,000 - $12,000,000"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Descripción del Cargo *</label>
            <textarea
              required
              value={nuevaVacante.descripcion}
              onChange={(e) => setNuevaVacante({...nuevaVacante, descripcion: e.target.value})}
              placeholder="Describe las responsabilidades y el alcance del cargo..."
              rows="4"
            />
          </div>

          <div className="form-group full-width">
            <label>Requisitos (uno por línea) *</label>
            <textarea
              required
              onChange={handleRequisitosChange}
              placeholder="Escribe cada requisito en una nueva línea..."
              rows="4"
            />
          </div>

          <div className="form-group full-width">
            <label>Habilidades Requeridas (separadas por comas) *</label>
            <input
              type="text"
              required
              onChange={handleSkillsChange}
              placeholder="Ej: Innovación, Design Thinking, Liderazgo"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-publicar">
              <i className="fas fa-paper-plane"></i>
              Publicar Vacante
            </button>
          </div>
        </form>
      )}

      <div className="filtros-section">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos los estados</option>
          <option value="Activa">Activas</option>
          <option value="En revisión">En revisión</option>
          <option value="Cerrada">Cerradas</option>
        </select>

        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todas las áreas</option>
          {areas.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      <div className="vacantes-grid">
        {filtrarVacantes().map(vacante => (
          <div key={vacante.id} className="vacante-card">
            <div className="vacante-header">
              <h3>{vacante.titulo}</h3>
              <span className={`estado ${vacante.estado.toLowerCase()}`}>
                {vacante.estado}
              </span>
            </div>

            <div className="vacante-meta">
              <span><i className="fas fa-building"></i> {vacante.area}</span>
              <span><i className="fas fa-map-marker-alt"></i> {vacante.ubicacion}</span>
              <span><i className="fas fa-clock"></i> {vacante.tipo}</span>
              <span><i className="fas fa-laptop-house"></i> {vacante.modalidad}</span>
            </div>

            <p className="vacante-descripcion">{vacante.descripcion}</p>

            <div className="vacante-skills">
              {vacante.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>

            <div className="vacante-footer">
              <div className="vacante-stats">
                <span className="postulaciones">
                  <i className="fas fa-users"></i>
                  {vacante.postulaciones} postulaciones
                </span>
                <span className="fecha">
                  <i className="fas fa-calendar-alt"></i>
                  {new Date(vacante.fecha_publicacion).toLocaleDateString()}
                </span>
              </div>
              <div className="vacante-acciones">
                <button className="btn-editar">
                  <i className="fas fa-edit"></i>
                  Editar
                </button>
                <button 
                  type="button"
                  className="btn-ver-postulaciones"
                  onClick={(e) => verPostulaciones(e, vacante.id)}
                >
                  <i className="fas fa-user-check"></i>
                  Ver Postulaciones
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GestionVacantes; 