import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/es';
// Importar el layout específico del consultor
import ConsultorLayout from '../../components/ConsultorLayout';
// Ruta para el CSS de esta página
import '../../styles/consultor-profile.css';
// Importa tu hook de autenticación si necesitas el ID del consultor para cargar su perfil
import { useAuth } from '../../context/AuthContext';

moment.locale('es');

const ConsultorProfilePage = () => {
  const { userData } = useAuth();
  const [consultorProfile, setConsultorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener el email del usuario actual desde el contexto de autenticación
  const currentUserEmail = userData?.user?.email;

  useEffect(() => {
    // TODO: Implementar la carga real del perfil del consultor
    const fetchConsultorProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Aquí deberías hacer la llamada a tu API para obtener el perfil del consultor
        // usando el ID del consultor (currentUser?.id)
        // const consultorId = currentUser?.id;
        // const response = await fetch(`/api/consultor-profile/${consultorId}`);
        // if (!response.ok) throw new Error('Error al cargar el perfil del consultor');
        // const data = await response.json();
        // setConsultorProfile({
        //     ...data,
        //     fechaFirmaOAMP: data.fechaFirmaOAMP ? new Date(data.fechaFirmaOAMP) : null, // Renombrado
        // });

        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 500));

        // Datos mock (simulados) para el perfil del consultor con los campos solicitados
        const mockProfiles = {
          'consultor1@demo.com': {
            id: '1234567890',
            nroConsultor: 'CCB-001-2025',
            nombreCompleto: 'Juan Carlos Pérez',
            cedula: '1234567890',
            email: 'consultor1@demo.com',
            celular: '+57 315 789 4561',
            direccion: 'Calle 72 #10-34, Bogotá D.C.',
            tipoVinculacion: 'Contrato de Prestación de Servicios',
            consecutivoOAMP: 'OAMP-2025-023',
            fechaFirmaOAMP: moment('2025-03-15').toDate(),
            areaConocimiento: 'Marketing digital, Estrategia empresarial, Desarrollo de negocios',
            experiencia: '10 años de experiencia en consultoría de marketing digital y estrategia empresarial.',
            fotoPerfilUrl: 'https://placehold.co/150x150/aabbcc/ffffff?text=JCP',
          },
          'consultor2@demo.com': {
            id: '1018425430',
            nroConsultor: 'CCB-002-2025',
            nombreCompleto: 'Adriana Marcela Díaz Jaime',
            cedula: '1018425430',
            email: 'consultor2@demo.com',
            celular: '+57 301 234 5678',
            direccion: 'Carrera 15 #85-30, Bogotá D.C.',
            tipoVinculacion: 'Contrato de Prestación de Servicios',
            consecutivoOAMP: 'OAMP-2025-024',
            fechaFirmaOAMP: moment('2025-04-09').toDate(),
            areaConocimiento: 'Finanzas corporativas, Proyecciones financieras, construcción y análisis de indicadores financieros',
            experiencia: '8 años de experiencia en consultoría financiera y desarrollo de proyectos empresariales.',
            fotoPerfilUrl: 'https://placehold.co/150x150/aabbcc/ffffff?text=AMD',
          }
        };

        // Simular obtener el email del usuario actual
        setConsultorProfile(mockProfiles[currentUserEmail]);
      } catch (err) {
        setError('Hubo un error al cargar la información del perfil.');
        console.error('Error fetching consultant profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Dependencia del ID del consultor si filtras por él */]); // Añadir dependencia si usas currentUser.id


  if (loading) {
    return (
      <ConsultorLayout>
        <div className="consultor-profile-container">
          <p className="loading-message">Cargando información del perfil...</p>
        </div>
      </ConsultorLayout>
    );
  }

  if (error) {
    return (
      <ConsultorLayout>
        <div className="consultor-profile-container">
          <p className="error-message">{error}</p>
        </div>
      </ConsultorLayout>
    );
  }

  if (!consultorProfile) {
       return (
         <ConsultorLayout>
            <div className="consultor-profile-container">
               <p className="error-message">No se encontró información de perfil para este consultor.</p>
            </div>
         </ConsultorLayout>
       );
  }

  return (
    <ConsultorLayout>
      <div className="consultor-profile-container">
        <h2>Mi Perfil</h2>

        <div className="profile-card">
            <div className="profile-header">
                <img
                    src={consultorProfile.fotoPerfilUrl}
                    alt="Foto de Perfil"
                    className="profile-picture"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x150/cccccc/ffffff?text=No+Foto" }} // Fallback si la imagen no carga
                />
                <h3>{consultorProfile.nombreCompleto}</h3>
                <p className="profile-id">ID Interno: {consultorProfile.id}</p> {/* Mantener ID interno si es relevante */}
            </div>

            <div className="profile-details-section">
                <h4>Información General</h4>
                <p><strong>N° CONSULTOR:</strong> {consultorProfile.nroConsultor}</p> {/* <-- Nuevo campo */}
                <p><strong>NOMBRE CONSULTOR:</strong> {consultorProfile.nombreCompleto}</p> {/* Ya existente, renombrado para claridad */}
                <p><strong>CEDULA:</strong> {consultorProfile.cedula}</p> {/* Ya existente, renombrado para claridad */}
                <p><strong>Email:</strong> {consultorProfile.email}</p>
                <p><strong>Celular:</strong> {consultorProfile.celular}</p>
                <p><strong>Dirección:</strong> {consultorProfile.direccion}</p>
            </div>

            <div className="profile-details-section">
                <h4>Información Contractual y Profesional</h4>
                <p><strong>Tipo de Vinculación:</strong> {consultorProfile.tipoVinculacion}</p>
                <p><strong>CONSECUTIVO OAMP:</strong> {consultorProfile.consecutivoOAMP}</p> {/* <-- Renombrado */}
                <p><strong>FECHA FIRMA OAMP:</strong> {moment(consultorProfile.fechaFirmaOAMP).format('DD/MM/YYYY')}</p> {/* <-- Renombrado */}
                <p><strong>ÁREA DEL CONOCIMIENTO:</strong> {consultorProfile.areaConocimiento}</p> {/* <-- Renombrado */}
                <p><strong>Experiencia:</strong> {consultorProfile.experiencia}</p>
            </div>

            {/* Puedes añadir una sección para editar el perfil si lo deseas */}
            {/* <div className="profile-actions">
                <button className="edit-profile-button">Editar Perfil</button>
            </div> */}
        </div>

      </div>
    </ConsultorLayout>
  );
};

export default ConsultorProfilePage;