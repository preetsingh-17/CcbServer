import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PostulacionesVacante.css';
import './Postulaciones.css';

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

const postulacionesEjemplo = [
  {
    id: 1,
    vacante: 'Consultor Senior de Innovación',
    candidato: {
      nombre: 'Ana María Rodríguez',
      email: 'ana.rodriguez@email.com',
      telefono: '+57 300 123 4567',
      experiencia: '7 años',
      educacion: [
        {
          titulo: 'MBA en Innovación Empresarial',
          institucion: 'Universidad de los Andes',
          año: '2020'
        },
        {
          titulo: 'Ingeniera Industrial',
          institucion: 'Universidad Nacional de Colombia',
          año: '2015'
        }
      ],
      experiencias: [
        {
          cargo: 'Consultora Senior de Innovación',
          empresa: 'Consultora XYZ',
          periodo: '2018 - 2024',
          descripcion: 'Liderazgo de proyectos de transformación digital y gestión del cambio para empresas del sector financiero.'
        },
        {
          cargo: 'Analista de Mejora Continua',
          empresa: 'Industrias ABC',
          periodo: '2015 - 2018',
          descripcion: 'Implementación de metodologías ágiles y procesos de mejora continua.'
        }
      ],
      habilidades: [
        'Design Thinking',
        'Gestión de Proyectos',
        'Metodologías Ágiles',
        'Innovación',
        'Liderazgo'
      ],
      certificaciones: [
        {
          nombre: 'Scrum Master Professional',
          entidad: 'Scrum Alliance',
          año: '2022'
        },
        {
          nombre: 'Design Thinking Professional',
          entidad: 'IDEO',
          año: '2021'
        }
      ],
      idiomas: [
        {
          idioma: 'Español',
          nivel: 'Nativo'
        },
        {
          idioma: 'Inglés',
          nivel: 'C1 - Avanzado'
        }
      ],
      linkedin: 'linkedin.com/in/anamariarodriguez'
    },
    fecha_postulacion: '2024-03-21',
    estado: 'En revisión',
    etapa: 'Entrevista Técnica',
    evaluacion: 4.5,
    notas: 'Excelente experiencia en consultoría de innovación. Pendiente validar referencias.'
  },
  {
    id: 2,
    vacante: 'Consultor Senior de Innovación',
    candidato: {
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@email.com',
      telefono: '+57 311 987 6543',
      experiencia: '5 años',
      educacion: 'Maestría en Gestión de Proyectos',
      linkedin: 'linkedin.com/in/carlosmendoza'
    },
    fecha_postulacion: '2024-03-20',
    estado: 'Seleccionado',
    etapa: 'Oferta Enviada',
    evaluacion: 4.8,
    notas: 'Candidato ideal para el puesto. Referencias verificadas.'
  }
];

function PostulacionesVacante() {
  const { vacanteId } = useParams();
  const navigate = useNavigate();
  const [vacante, setVacante] = useState(null);
  const [postulaciones, setPostulaciones] = useState(postulacionesEjemplo);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  

  useEffect(() => {
    // En una aplicación real, aquí harías una llamada a la API
    // Por ahora, simulamos obtener la vacante del array de ejemplo
    const vacanteEncontrada = vacantesIniciales.find(v => v.id === parseInt(vacanteId));
    if (vacanteEncontrada) {
      setVacante(vacanteEncontrada);
    } else {
      // Si no se encuentra la vacante, redirigir a la lista de vacantes
      navigate('/reclutador/vacantes');
    }
  }, [vacanteId, navigate]);

  const estados = ['En revisión', 'Entrevista Programada', 'Seleccionado', 'Rechazado'];
  const etapas = [
    'Revisión CV',
    'Entrevista RRHH',
    'Entrevista Técnica',
    'Evaluación',
    'Oferta Enviada',
    'Proceso Completado'
  ];

  const filtrarPostulaciones = () => {
    return postulaciones.filter(postulacion => {
      const cumpleEstado = !filtroEstado || postulacion.estado === filtroEstado;
      const cumpleEtapa = !filtroEtapa || postulacion.etapa === filtroEtapa;
      return cumpleEstado && cumpleEtapa;
    });
  };

  const actualizarEstado = (id, nuevoEstado) => {
    const postulacionesActualizadas = postulaciones.map(postulacion =>
      postulacion.id === id ? {...postulacion, estado: nuevoEstado} : postulacion
    );
    setPostulaciones(postulacionesActualizadas);
  };

  const actualizarEtapa = (id, nuevaEtapa) => {
    const postulacionesActualizadas = postulaciones.map(postulacion =>
      postulacion.id === id ? {...postulacion, etapa: nuevaEtapa} : postulacion
    );
    setPostulaciones(postulacionesActualizadas);
  };

  const verDetalleCandidato = (candidato) => {
    setCandidatoSeleccionado(candidato);
    setMostrarDetalle(true);
  };

  if (!vacante) {
    return (
      <div className="postulaciones-vacante-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando información de la vacante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="postulaciones-container">
      <div className="header-section">
        <div className="titulo-seccion">
         <button className="btn-volver" onClick={() => navigate('/reclutador/vacantes')}>
            <i className="fas fa-arrow-left"></i>
            Volver a Vacantes
          </button>
          <h2>Postulaciones - {vacante.titulo}</h2>
          <div className="vacante-info">
            <p className="vacante-meta">
              <span><i className="fas fa-building"></i> {vacante.area}</span>
              <span><i className="fas fa-map-marker-alt"></i> {vacante.ubicacion}</span>
              <span><i className="fas fa-clock"></i> {vacante.tipo}</span>
              <span><i className="fas fa-laptop-house"></i> {vacante.modalidad}</span>
            </p>
            <p className="postulaciones-count">{postulaciones.length} candidatos postulados</p>
        </div>
      </div>
      </div>
      <div className="filtros-section">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos los estados</option>
          {estados.map(estado => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>

        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todas las etapas</option>
          {etapas.map(etapa => (
            <option key={etapa} value={etapa}>{etapa}</option>
          ))}
        </select>
      </div>

      <div className="postulaciones-grid">
        {filtrarPostulaciones().map(postulacion => (
          <div className="postulacion-card">
  <div className="postulacion-header">
    <h3>{postulacion.candidato.nombre}</h3>
    <span className={`estado ${postulacion.estado.toLowerCase().replace(/\s+/g, '-')}`}>
      {postulacion.estado}
    </span>
  </div>

  <div className="postulacion-info">
    <div className="info-item">
      <i className="fas fa-briefcase"></i>
      <span>{vacante.titulo}</span>
    </div>
    <div className="info-item">
      <i className="fas fa-calendar-alt"></i>
      <span>{new Date(postulacion.fecha_postulacion).toLocaleDateString()}</span>
    </div>
    <div className="info-item">
      <i className="fas fa-star"></i>
      <span>
        Evaluación: {postulacion.evaluacion !== null ? `${postulacion.evaluacion}/5` : 'Sin evaluar'}
      </span>
    </div>
  </div>

  <div className="etapa-actual">
    <h4>Etapa Actual</h4>
    <div className="etapas-progreso">
      {etapas.map((etapa, index) => (
        <div
          key={etapa}
          className={`etapa ${etapas.indexOf(postulacion.etapa) >= index ? 'completada' : ''}`}
        >
          {etapa}
        </div>
      ))}
    </div>
  </div>

  <div className="postulacion-acciones">
    <select
      value={postulacion.estado}
      onChange={(e) => actualizarEstado(postulacion.id, e.target.value)}
      className="select-estado"
    >
      {estados.map(estado => (
        <option key={estado} value={estado}>{estado}</option>
      ))}
    </select>

    <select
      value={postulacion.etapa}
      onChange={(e) => actualizarEtapa(postulacion.id, e.target.value)}
      className="select-etapa"
    >
      {etapas.map(etapa => (
        <option key={etapa} value={etapa}>{etapa}</option>
      ))}
    </select>

    <button
      className="btn-ver-perfil"
      onClick={() => verDetalleCandidato(postulacion.candidato)}
    >
      <i className="fas fa-user"></i>
      Ver Hoja de Vida
    </button>
  </div>

  <div className="postulacion-notas">
    <h4>Notas</h4>
    <p>{postulacion.notas || 'No hay notas registradas.'}</p>
  </div>
</div>

        ))}
      </div>

      {mostrarDetalle && candidatoSeleccionado && (
        <div className="modal-detalle">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Hoja de Vida</h3>
              <button onClick={() => setMostrarDetalle(false)} className="btn-cerrar">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="candidato-info">
              <div className="info-seccion">
                <h4>Información Personal</h4>
                <p><strong>Nombre:</strong> {candidatoSeleccionado.nombre}</p>
                <p><strong>Email:</strong> {candidatoSeleccionado.email}</p>
                <p><strong>Teléfono:</strong> {candidatoSeleccionado.telefono}</p>
              </div>

              <div className="info-seccion">
                <h4>Educación</h4>
                {candidatoSeleccionado.educacion?.map((edu, index) => (
                  <div key={index} className="educacion-item">
                    <h5>{edu.titulo}</h5>
                    <p>{edu.institucion} - {edu.año}</p>
                  </div>
                ))}
              </div>

              <div className="info-seccion">
                <h4>Experiencia Profesional</h4>
                {candidatoSeleccionado.experiencias?.map((exp, index) => (
                  <div key={index} className="experiencia-item">
                    <h5>{exp.cargo}</h5>
                    <p className="empresa-periodo">{exp.empresa} | {exp.periodo}</p>
                    <p className="descripcion">{exp.descripcion}</p>
                  </div>
                ))}
              </div>

              <div className="info-seccion">
                <h4>Habilidades</h4>
                <div className="habilidades-grid">
                  {candidatoSeleccionado.habilidades?.map((habilidad, index) => (
                    <span key={index} className="habilidad-tag">{habilidad}</span>
                  ))}
                </div>
              </div>

              <div className="info-seccion">
                <h4>Certificaciones</h4>
                {candidatoSeleccionado.certificaciones?.map((cert, index) => (
                  <div key={index} className="certificacion-item">
                    <h5>{cert.nombre}</h5>
                    <p>{cert.entidad} - {cert.año}</p>
                  </div>
                ))}
              </div>

              <div className="info-seccion">
                <h4>Idiomas</h4>
                {candidatoSeleccionado.idiomas?.map((idioma, index) => (
                  <div key={index} className="idioma-item">
                    <span className="idioma-nombre">{idioma.idioma}</span>
                    <span className="idioma-nivel">{idioma.nivel}</span>
                  </div>
                ))}
              </div>

              <div className="info-seccion">
                <h4>Enlaces Profesionales</h4>
                <a href={`https://${candidatoSeleccionado.linkedin}`} target="_blank" rel="noopener noreferrer" className="linkedin-link">
                  <i className="fab fa-linkedin"></i> Ver perfil de LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostulacionesVacante; 