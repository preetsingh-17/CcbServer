// src/pages/Gestora/NuevaProgramacionPage.js
import React, { useState, useEffect } from "react";
// Importamos Link para la navegación
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import "./NuevaProgramacionPage.css";
import { colors } from "../../colors";
import * as XLSX from "xlsx";
import apiService from "../../utils/api";
import { useAuth } from "../../context/AuthContext"; // Importamos useAuth
import NotificationService from '../../utils/notificationService';

function NuevaProgramacionPage() {
  const navigate = useNavigate();
  const { userData } = useAuth(); // Obtenemos userData del contexto
  
  // =========================================================================
  // Estados para modo edición
  // =========================================================================
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // =========================================================================
  // Estados para datos de la base de datos
  // =========================================================================
  const [actividades, setActividades] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gestoraCedula, setGestoraCedula] = useState(null);

  // =========================================================================
  // Estados para el formulario
  // =========================================================================
  const [actividadSeleccionada, setActividadSeleccionada] = useState("");
  const [programaSeleccionado, setProgramaSeleccionado] = useState("");
  const [rutaSeleccionada, setRutaSeleccionada] = useState("");
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState("");
  const [regionSeleccionada, setRegionSeleccionada] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [contratoOAMP, setContratoOAMP] = useState("");
  const [consultorSeleccionado, setConsultorSeleccionado] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Campos comunes para ambos tipos
  const [tematica, setTematica] = useState("");
  const [mes, setMes] = useState("");
  const [fechaFormacion, setFechaFormacion] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [horasDictar, setHorasDictar] = useState("");
  const [coordinadorCCB, setCoordinadorCCB] = useState("");
  const [direccion, setDireccion] = useState("");
  const [enlace, setEnlace] = useState("");
  const [codigoAgenda, setCodigoAgenda] = useState("");
  const [entregables, setEntregables] = useState("");
  const [dependencia, setDependencia] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Campos específicos para programaciones individuales
  const [nombreEmpresario, setNombreEmpresario] = useState("");
  const [identificacionEmpresario, setIdentificacionEmpresario] = useState("");

  // Campos calculados
  const [horasPagar, setHorasPagar] = useState("");
  const [horasCobrar, setHorasCobrar] = useState("");
  const [valorHora, setValorHora] = useState("");
  const [valorTotalPagar, setValorTotalPagar] = useState("");
  const [valorTotalCobrar, setValorTotalCobrar] = useState("");

  // Nuevo estado para el sector seleccionado
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');

  // =========================================================================
  // Efectos para cargar datos de la base de datos
  // =========================================================================
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(''); // Limpiar errores anteriores
        
        console.log('🔍 Iniciando carga de datos con userData:', userData);
        
        // Verificar si tenemos la información del usuario
        if (!userData?.user?.id) {
          console.error('❌ No se encontró información del usuario en userData:', userData);
          setError('No se encontró información del usuario');
          setLoading(false);
          return;
        }

        console.log('👤 ID del usuario encontrado:', userData.user.id);

        // Obtener la información completa del usuario
        try {
          const userInfoResponse = await apiService.request(`/usuarios/${userData.user.id}`);
          console.log('📋 Respuesta de información del usuario:', userInfoResponse);
          
          if (!userInfoResponse.success) {
            console.error('❌ Error en la respuesta de usuarios:', userInfoResponse);
            setError('Error obteniendo información del usuario: ' + (userInfoResponse.message || 'Error desconocido'));
            setLoading(false);
            return;
          }

          const cedula = userInfoResponse.data.usu_cedula;
          console.log('🆔 Cédula obtenida:', cedula);
          setGestoraCedula(cedula);

          // Cargar todos los datos necesarios
          console.log('📥 Iniciando carga de datos con cédula:', cedula);
          
          const [
            actividadesRes,
            modalidadesRes,
            programaRutasRes,
            regionesRes,
            contratosRes
          ] = await Promise.all([
            apiService.getActividades(),
            apiService.getModalidades(),
            apiService.getProgramaRutas(),
            apiService.getRegiones(),
            apiService.getContratos(cedula)
          ]);

          console.log('📊 Resultados obtenidos:', {
            actividades: actividadesRes,
            modalidades: modalidadesRes,
            programas: programaRutasRes,
            regiones: regionesRes,
            contratos: contratosRes
          });

          if (actividadesRes.success) {
            console.log('✅ Actividades cargadas:', actividadesRes.data.actividades.length);
            setActividades(actividadesRes.data.actividades);
          } else {
            console.error('❌ Error cargando actividades:', actividadesRes);
          }

          if (modalidadesRes.success) {
            console.log('✅ Modalidades cargadas:', modalidadesRes.data.modalidades.length);
            setModalidades(modalidadesRes.data.modalidades);
          } else {
            console.error('❌ Error cargando modalidades:', modalidadesRes);
          }

          if (programaRutasRes.success) {
            console.log('✅ Programas cargados:', programaRutasRes.data.programas.length);
            setProgramas(programaRutasRes.data.programas);
          } else {
            console.error('❌ Error cargando programas:', programaRutasRes);
          }

          if (regionesRes.success) {
            console.log('✅ Regiones cargadas:', regionesRes.data.regiones.length);
            setRegiones(regionesRes.data.regiones);
          } else {
            console.error('❌ Error cargando regiones:', regionesRes);
          }

          if (contratosRes.success) {
            console.log('✅ Contratos cargados:', contratosRes.data.contratos.length);
            setContratos(contratosRes.data.contratos);
          } else {
            console.error('❌ Error cargando contratos:', contratosRes);
          }

        } catch (userInfoError) {
          console.error('❌ Error obteniendo información del usuario:', userInfoError);
          setError('Error al obtener información del usuario: ' + (userInfoError.message || 'Error desconocido'));
          setLoading(false);
          return;
        }

      } catch (error) {
        console.error('❌ Error general cargando datos:', error);
        setError('Error cargando los datos iniciales: ' + (error.message || 'Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, [userData]);

  // Efecto para cargar municipios cuando cambia la región
  useEffect(() => {
    const cargarMunicipios = async () => {
      if (!regionSeleccionada) {
        setMunicipios([]);
      return;
    }

      try {
        const result = await apiService.getMunicipiosByRegion(regionSeleccionada);
        if (result.success) {
          setMunicipios(result.data.municipios);
        }
      } catch (error) {
        console.error('Error cargando municipios:', error);
      }
    };

    cargarMunicipios();
  }, [regionSeleccionada]);

  // =========================================================================
  // Efectos para modo edición
  // =========================================================================
  useEffect(() => {
    // Detectar si estamos en modo edición
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'edit') {
      setIsEditMode(true);
      
      // Cargar datos de edición desde localStorage
      const editDataString = localStorage.getItem('programacionEditar');
      if (editDataString) {
        try {
          const editInfo = JSON.parse(editDataString);
          setEditData(editInfo);
          console.log('📝 Modo edición activado:', editInfo);
          
        } catch (error) {
          console.error('Error parsing edit data:', error);
          setError('Error al cargar los datos para edición');
        }
      } else {
        console.warn('No se encontraron datos de edición en localStorage');
        setError('No se encontraron datos para editar');
      }
    }
  }, []);

  // Efecto separado para poblar el formulario cuando ya tenemos todos los datos
  useEffect(() => {
    if (isEditMode && editData && !loading && programas.length > 0 && actividades.length > 0 && modalidades.length > 0 && contratos.length > 0) {
      console.log('📋 Poblando formulario con datos cargados...');
      poblarFormularioConDatos(editData);
    }
  }, [isEditMode, editData, loading, programas, actividades, modalidades, contratos]);

  // Efecto para establecer información del consultor en modo edición
  useEffect(() => {
    if (isEditMode && contratoOAMP && contratos.length > 0 && !consultorSeleccionado) {
      const contrato = contratos.find(c => c.oamp.toString() === contratoOAMP);
      if (contrato) {
        const consultorData = {
          ...contrato,
          usu_segundo_nombre: contrato.usu_segundo_nombre || '',
          usu_telefono: contrato.usu_telefono || 'No especificado',
          usu_direccion: contrato.usu_direccion || 'No especificada',
          are_descripcion: contrato.are_descripcion || 'No especificada'
        };
        
        setConsultorSeleccionado(consultorData);
        console.log('📋 Consultor establecido en modo edición:', consultorData);
      }
    }
  }, [isEditMode, contratoOAMP, contratos, consultorSeleccionado]);
  

  // Función para poblar el formulario con datos existentes (corregida)
  const poblarFormularioConDatos = (editInfo) => {
    const { data, tipo } = editInfo;
    
    console.log('🔄 Poblando formulario con datos:', { data, tipo });
    
    // Función helper para formatear horas
    const formatearHora = (hora) => {
      if (!hora) return '';
      
      // Si ya está en formato HH:MM, devolverla tal como está
      if (typeof hora === 'string' && hora.match(/^\d{2}:\d{2}$/)) {
        return hora;
      }
      
      // Si viene como timestamp o con segundos, extraer solo HH:MM
      let horaString = String(hora);
      if (horaString.includes('T')) {
        horaString = horaString.split('T')[1];
      }
      if (horaString.includes(':')) {
        const partes = horaString.split(':');
        return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
      }
      
      return horaString;
    };

    // Función helper para formatear fecha
    const formatearFecha = (fecha) => {
      if (!fecha) return '';
      
      if (fecha.includes('T')) {
        return fecha.split('T')[0];
      }
      return fecha;
    };
    
    if (tipo === 'grupal') {
      // Datos para programación grupal
      setActividadSeleccionada(data.act_id?.toString() || '');
      setModalidadSeleccionada(data.mod_id?.toString() || '');
      setRutaSeleccionada(data.pr_id?.toString() || '');
      
      // Usar el prog_id del backend si está disponible
      if (data.prog_id) {
        setProgramaSeleccionado(data.prog_id.toString());
        console.log('📋 Programa establecido desde backend:', data.prog_id);
      } else {
        // Fallback: buscar el programa que contiene esta ruta
        const rutaEncontrada = programas.find(prog => 
          prog.rutas.some(ruta => ruta.pr_id.toString() === data.pr_id?.toString())
        );
        if (rutaEncontrada) {
          setProgramaSeleccionado(rutaEncontrada.prog_id.toString());
          console.log('📋 Programa encontrado por búsqueda:', rutaEncontrada.prog_nombre);
        }
      }
      
      setContratoOAMP(data.oamp?.toString() || '');
      setTematica(data.pro_tematica || '');
      setMes(data.pro_mes || '');
      setFechaFormacion(formatearFecha(data.pro_fecha_formacion));
      setHoraInicio(formatearHora(data.pro_hora_inicio));
      setHoraFin(formatearHora(data.pro_hora_fin));
      setHorasDictar(data.pro_horas_dictar?.toString() || '');
      setCoordinadorCCB(data.pro_coordinador_ccb || '');
      setDireccion(data.pro_direccion || '');
      setEnlace(data.pro_enlace || '');
      setCodigoAgenda(data.pro_codigo_agenda?.toString() || '');
      setEntregables(data.pro_entregables || '');
      setDependencia(data.pro_dependencia || '');
      setObservaciones(data.pro_observaciones || '');
      
      // Convertir val_reg_id a reg_id para mostrar la región correcta
      if (data.val_reg_id) {
        const regionEncontrada = regiones.find(r => r.val_reg_id.toString() === data.val_reg_id.toString());
        setRegionSeleccionada(regionEncontrada ? regionEncontrada.reg_id : '');
      } else {
        setRegionSeleccionada('');
      }
      
      // Valores calculados
      setHorasPagar(data.pro_numero_hora_pagar?.toString() || '');
      setHorasCobrar(data.pro_numero_hora_cobrar?.toString() || '');
      setValorHora(data.pro_valor_hora?.toString() || '');
      setValorTotalPagar(data.pro_valor_total_hora_pagar?.toString() || '');
      setValorTotalCobrar(data.pro_valor_total_hora_ccb?.toString() || '');
      
    } else if (tipo === 'individual') {
      // Datos para programación individual
      setActividadSeleccionada(data.act_id?.toString() || '');
      setModalidadSeleccionada(data.mod_id?.toString() || '');
      setRutaSeleccionada(data.pr_id?.toString() || '');
      
      // Usar el prog_id del backend si está disponible
      if (data.prog_id) {
        setProgramaSeleccionado(data.prog_id.toString());
        console.log('📋 Programa establecido desde backend:', data.prog_id);
      } else {
        // Fallback: buscar el programa que contiene esta ruta
        const rutaEncontrada = programas.find(prog => 
          prog.rutas.some(ruta => ruta.pr_id.toString() === data.pr_id?.toString())
        );
        if (rutaEncontrada) {
          setProgramaSeleccionado(rutaEncontrada.prog_id.toString());
          console.log('📋 Programa encontrado por búsqueda:', rutaEncontrada.prog_nombre);
        }
      }
      
      setContratoOAMP(data.oamp?.toString() || '');
      setTematica(data.proin_tematica || '');
      setMes(data.proin_mes || '');
      setFechaFormacion(formatearFecha(data.proin_fecha_formacion));
      setHoraInicio(formatearHora(data.proin_hora_inicio));
      setHoraFin(formatearHora(data.proin_hora_fin));
      setHorasDictar(data.proin_horas_dictar?.toString() || '');
      setCoordinadorCCB(data.proin_coordinador_ccb || '');
      setDireccion(data.proin_direccion || '');
      setEnlace(data.proin_enlace || '');
      setCodigoAgenda(data.proin_codigo_agenda?.toString() || '');
      setEntregables(data.proin_entregables || '');
      setDependencia(data.proin_dependencia || '');
      setObservaciones(data.proin_observaciones || '');
      
      // Convertir val_reg_id a reg_id para mostrar la región correcta
      if (data.val_reg_id) {
        const regionEncontrada = regiones.find(r => r.val_reg_id.toString() === data.val_reg_id.toString());
        setRegionSeleccionada(regionEncontrada ? regionEncontrada.reg_id : '');
      } else {
        setRegionSeleccionada('');
      }
      
      // Campos específicos de individual
      setNombreEmpresario(data.proin_nombre_empresario || '');
      setIdentificacionEmpresario(data.proin_identificacion_empresario || '');
      
      // Valores calculados
      setHorasPagar(data.proin_numero_hora_pagar?.toString() || '');
      setHorasCobrar(data.proin_numero_hora_cobrar?.toString() || '');
      setValorHora(data.proin_valor_hora?.toString() || '');
      setValorTotalPagar(data.proin_valor_total_hora_pagar?.toString() || '');
      setValorTotalCobrar(data.proin_valor_total_hora_ccb?.toString() || '');
    }
    
    console.log('✅ Formulario poblado completamente con datos de edición');
  };

  // =========================================================================
  // Funciones auxiliares
  // =========================================================================
  
  const esActividadGrupal = () => {
    const actividad = actividades.find(a => a.act_id.toString() === actividadSeleccionada);
    return actividad && actividad.act_tipo.includes('TALLERES') || actividad?.act_tipo.includes('GRUPALES') || actividad?.act_tipo.includes('CÁPSULAS');
  };

  const esActividadIndividual = () => {
    const actividad = actividades.find(a => a.act_id.toString() === actividadSeleccionada);
    return actividad && actividad.act_tipo.includes('INDIVIDUALES');
  };

  const obtenerRutasDelPrograma = () => {
    const programa = programas.find(p => p.prog_id.toString() === programaSeleccionado);
    return programa ? programa.rutas : [];
  };

  // Función para formatear el nombre completo del consultor
  const formatearNombreCompleto = (contrato) => {
    return contrato.nombre_completo || 'Nombre no disponible';
  };

  // Función para formatear el nombre en el dropdown
  const formatearNombreDropdown = (contrato) => {
    return `${contrato.oamp} - ${formatearNombreCompleto(contrato)}`;
  };

  const calcularValores = async () => {
    // Verificar que tenemos los datos necesarios
    if (!rutaSeleccionada || !horasDictar) {
      return;
    }

    try {
      console.log('🔄 Calculando valores con datos reales de la base de datos...');
      
      // Si hay región seleccionada, buscar el val_reg_id correspondiente
      let valRegId = '';
      if (regionSeleccionada) {
        const regionEncontrada = regiones.find(r => r.reg_id === regionSeleccionada);
        valRegId = regionEncontrada ? regionEncontrada.val_reg_id : '';
      }
      
      const result = await apiService.calcularValoresRuta(
        rutaSeleccionada,
        valRegId,
        modalidadSeleccionada,
        horasDictar
      );

      if (result && result.success) {
        const { valorHora, horasPagar, horasCobrar, valorTotalPagar, valorTotalCobrar } = result.data;
        
        console.log('💰 Valores calculados desde la base de datos:', {
          valorHora,
          horasPagar,
          horasCobrar,
          valorTotalPagar,
          valorTotalCobrar
        });

        setHorasPagar(horasPagar.toString());
        setHorasCobrar(horasCobrar.toString());
        setValorHora(valorHora.toString());
        setValorTotalPagar(valorTotalPagar.toString());
        setValorTotalCobrar(valorTotalCobrar.toString());
      } else {
        console.warn('⚠️ Error al calcular valores, usando valores por defecto');
        // Fallback a valores por defecto en caso de error
        const horas = parseInt(horasDictar) || 0;
        const valorBase = 85000;
        
        setHorasPagar(horas.toString());
        setHorasCobrar(horas.toString());
        setValorHora(valorBase.toString());
        setValorTotalPagar((horas * valorBase).toString());
        setValorTotalCobrar((horas * valorBase * 2).toString());
      }
    } catch (error) {
      console.error('❌ Error al calcular valores:', error);
      // Fallback a valores por defecto en caso de error
      const horas = parseInt(horasDictar) || 0;
      const valorBase = 85000;
      
      setHorasPagar(horas.toString());
      setHorasCobrar(horas.toString());
      setValorHora(valorBase.toString());
      setValorTotalPagar((horas * valorBase).toString());
      setValorTotalCobrar((horas * valorBase * 2).toString());
    }
  };

  // Función para verificar completitud de datos del consultor
  const verificarCompleitudDatos = (consultor) => {
    const camposFaltantes = [];
    
    if (!consultor.usu_primer_nombre) camposFaltantes.push('Primer nombre');
    if (!consultor.usu_primer_apellido) camposFaltantes.push('Primer apellido');
    if (!consultor.usu_segundo_apellido) camposFaltantes.push('Segundo apellido');
    if (!consultor.usu_telefono || consultor.usu_telefono === 'No especificado') camposFaltantes.push('Teléfono');
    if (!consultor.usu_direccion || consultor.usu_direccion === 'No especificada') camposFaltantes.push('Dirección');
    if (!consultor.are_descripcion || consultor.are_descripcion === 'No especificada') camposFaltantes.push('Área de conocimiento');
    
    return camposFaltantes;
  };

  // Función para manejar el cambio de contrato
  const handleContratoChange = async (contratoId) => {
    console.log('🔄 Contrato seleccionado:', contratoId);
    
    // Limpiar el estado anterior
    setContratoOAMP(contratoId);
    
    if (!contratoId) {
      setConsultorSeleccionado(null);
      return;
    }
    
    try {
      // Encontrar el contrato seleccionado
      const contratoSeleccionado = contratos.find(c => c.oamp === parseInt(contratoId));
      
      if (contratoSeleccionado) {
        console.log('📋 Datos del contrato:', contratoSeleccionado);
        
        // Obtener información adicional del usuario usando la ruta de debug
        const userInfoResponse = await apiService.request(`/programaciones/debug-consultor/${contratoSeleccionado.usu_cedula}`);
        console.log('👤 Información adicional del usuario:', userInfoResponse);
        
        if (userInfoResponse.success && userInfoResponse.data.consultor) {
          const userInfo = userInfoResponse.data.consultor;
          
          // Actualizar la información del consultor seleccionado con todos los campos necesarios
          setConsultorSeleccionado({
            ...contratoSeleccionado,
            cedula: contratoSeleccionado.usu_cedula,
            nombre_completo: formatearNombreCompleto(contratoSeleccionado),
            usu_telefono: userInfo.usu_telefono || 'No especificado',
            usu_direccion: userInfo.usu_direccion || 'No especificada',
            areaConocimiento: userInfo.are_descripcion || contratoSeleccionado.are_descripcion || 'No especificada',
            oamp_valor_total: contratoSeleccionado.oamp_valor_total || 0,
            oamp_fecha_generacion: contratoSeleccionado.oamp_fecha_generacion || 'Invalid Date'
          });
        } else {
          console.warn('⚠️ No se encontró información adicional del usuario');
          // Usar solo la información del contrato
          setConsultorSeleccionado({
            ...contratoSeleccionado,
            cedula: contratoSeleccionado.usu_cedula,
            nombre_completo: formatearNombreCompleto(contratoSeleccionado),
            usu_telefono: 'No especificado',
            usu_direccion: 'No especificada',
            areaConocimiento: contratoSeleccionado.are_descripcion || 'No especificada',
            oamp_valor_total: contratoSeleccionado.oamp_valor_total || 0,
            oamp_fecha_generacion: contratoSeleccionado.oamp_fecha_generacion || 'Invalid Date'
          });
          setError('Advertencia: Algunos datos del consultor no están disponibles en el sistema.');
        }
      } else {
        console.error('❌ No se encontró el contrato:', contratoId);
        setError('Error al seleccionar el contrato');
        setConsultorSeleccionado(null);
      }
    } catch (error) {
      console.error('❌ Error al procesar la selección del contrato:', error);
      setError('Error al procesar la información del consultor');
      setConsultorSeleccionado(null);
    }
  };

  useEffect(() => {
    if (horasDictar && rutaSeleccionada) {
      calcularValores();
    }
  }, [horasDictar, regionSeleccionada, municipioSeleccionado, modalidadSeleccionada, rutaSeleccionada]);

  // =========================================================================
  // Función para enviar el formulario
  // =========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const ruta = obtenerRutasDelPrograma().find(r => r.pr_id.toString() === rutaSeleccionada);
      
      if (!ruta) {
        setError("Ruta no encontrada");
        return;
      }

      // Convertir reg_id a val_reg_id si hay región seleccionada
      let valRegId = null;
      if (regionSeleccionada) {
        const regionEncontrada = regiones.find(r => r.reg_id === regionSeleccionada);
        valRegId = regionEncontrada ? regionEncontrada.val_reg_id : null;
      }

      if (!consultorSeleccionado || !consultorSeleccionado.usu_cedula) {
        setError("Por favor, selecciona un contrato OAMP para asignar un consultor.");
        return;
    }

      // Datos comunes
      const datosComunes = {
        consultor_cedula: consultorSeleccionado.usu_cedula,
        pr_id: parseInt(rutaSeleccionada),
        act_id: parseInt(actividadSeleccionada),
        mod_id: parseInt(modalidadSeleccionada),
        oamp: parseInt(contratoOAMP),
        val_reg_id: valRegId,
        pro_codigo_agenda: parseInt(codigoAgenda),
        pro_mes: mes,
        pro_fecha_formacion: fechaFormacion,
        pro_hora_inicio: horaInicio,
        pro_hora_fin: horaFin,
        pro_horas_dictar: parseInt(horasDictar),
        pro_coordinador_ccb: coordinadorCCB,
        pro_direccion: direccion,
        pro_enlace: enlace,
        pro_numero_hora_pagar: parseInt(horasPagar),
        pro_numero_hora_cobrar: parseInt(horasCobrar),
        pro_valor_hora: parseFloat(valorHora),
        pro_valor_total_hora_pagar: parseFloat(valorTotalPagar),
        pro_valor_total_hora_ccb: parseFloat(valorTotalCobrar),
        pro_entregables: entregables,
        pro_dependencia: dependencia,
        pro_observaciones: observaciones
      };

      let result;

      if (isEditMode && editData) {
        // MODO EDICIÓN
        console.log('📝 Modo edición - actualizando programación:', editData.id);
        
        if (editData.tipo === 'grupal') {
          // Actualizar programación grupal
          result = await apiService.updateProgramacion(editData.id, {
            ...datosComunes,
            pro_tematica: tematica
          });
        } else if (editData.tipo === 'individual') {
          // Actualizar programación individual - cambiar prefijos pro_ por proin_
          const datosIndividuales = {
            consultor_cedula: consultorSeleccionado.usu_cedula,
            pr_id: parseInt(rutaSeleccionada),
            act_id: parseInt(actividadSeleccionada),
            mod_id: parseInt(modalidadSeleccionada),
            oamp: parseInt(contratoOAMP),
            val_reg_id: valRegId, // Ya es null si no hay región
            
            // Usar los estados del formulario directamente con el prefijo "proin_"
            proin_codigo_agenda: parseInt(codigoAgenda),
            proin_mes: mes,
            proin_fecha_formacion: fechaFormacion,
            proin_hora_inicio: horaInicio,
            proin_hora_fin: horaFin,
            proin_horas_dictar: parseInt(horasDictar),
            proin_coordinador_ccb: coordinadorCCB,
            proin_direccion: direccion,
            proin_enlace: enlace,
            proin_numero_hora_pagar: parseInt(horasPagar),
            proin_numero_hora_cobrar: parseInt(horasCobrar),
            proin_valor_hora: parseFloat(valorHora),
            proin_valor_total_hora_pagar: parseFloat(valorTotalPagar),
            proin_valor_total_hora_ccb: parseFloat(valorTotalCobrar),
            proin_entregables: entregables,
            proin_dependencia: dependencia,
            proin_observaciones: observaciones,
            
            // Campos específicos que ya estaban bien
            proin_tematica: tematica,
            proin_nombre_empresario: nombreEmpresario,
            proin_identificacion_empresario: identificacionEmpresario
        };
          Object.keys(datosComunes).forEach(key => {
            if (key.startsWith('pro_')) {
              datosIndividuales[key.replace('pro_', 'proin_')] = datosComunes[key];
            } else {
              datosIndividuales[key] = datosComunes[key];
            }
          });

          result = await apiService.updateProgramacion(editData.id, {
            ...datosIndividuales,
            proin_tematica: tematica,
            proin_nombre_empresario: nombreEmpresario,
            proin_identificacion_empresario: identificacionEmpresario
          });
        }
        
        if (result && result.success) {
          setSuccess("Programación actualizada exitosamente");
          // Limpiar datos de edición
          localStorage.removeItem('programacionEditar');
          setTimeout(() => {
            navigate("/gestora");
          }, 2000);
        } else {
          setError(result?.message || "Error al actualizar la programación");
        }
        
      } else {
        // MODO CREACIÓN (código original)
        if (esActividadGrupal()) {
          // Programación grupal
          result = await apiService.createProgramacionGrupal({
            ...datosComunes,
            pro_tematica: tematica
          });
        } else if (esActividadIndividual()) {
          // Programación individual - cambiar prefijos pro_ por proin_
          const datosIndividuales = {};
          Object.keys(datosComunes).forEach(key => {
              if (key.startsWith('pro_')) {
                  datosIndividuales[key.replace('pro_', 'proin_')] = datosComunes[key];
              } else {
                  datosIndividuales[key] = datosComunes[key];
              }
          });

          result = await apiService.createProgramacionIndividual({
            ...datosIndividuales,
            proin_tematica: tematica,
            proin_nombre_empresario: nombreEmpresario,
            proin_identificacion_empresario: identificacionEmpresario
          });
        }

        if (result && result.success) {
          setSuccess("Programación creada exitosamente");
          setTimeout(() => {
            navigate("/gestora");
          }, 2000);
        } else {
          setError(result?.message || "Error al crear la programación");
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || "Error al enviar el formulario");
    }
  };

  // Función para hacer debug específico del consultor
  const debugConsultorActual = async () => {
    if (!consultorSeleccionado?.usu_cedula) {
      alert('No hay consultor seleccionado');
        return;
      }
  
    try {
      const result = await apiService.debugConsultor(consultorSeleccionado.usu_cedula);
      console.log('🔍 Debug consultor desde API:', result);
      
      if (result.success && result.data.consultor) {
        alert(`Debug Consultor:\n${JSON.stringify(result.data.consultor, null, 2)}`);
      } else {
        alert('No se encontraron datos del consultor');
      }
    } catch (error) {
      console.error('Error en debug:', error);
      alert('Error al obtener debug del consultor');
    }
  };

  // Componente para mostrar errores
  const ErrorMessage = ({ message }) => (
    <div style={{ 
      color: '#721c24',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '20px'
    }}>
      <strong>Error:</strong> {message}
    </div>
  );

  // Componente para mostrar mensajes de éxito
  const SuccessMessage = ({ message }) => (
    <div style={{ 
      color: '#155724',
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '20px'
    }}>
      {message}
    </div>
  );

  // Función para obtener los sectores de la ruta seleccionada
  const obtenerSectoresDeRuta = () => {
    const programa = programas.find(p => p.prog_id.toString() === programaSeleccionado);
    if (!programa) return [];
    const ruta = programa.rutas.find(r => r.pr_id.toString() === rutaSeleccionada);
    return ruta && ruta.sectores ? ruta.sectores : [];
  };

  // =========================================================================
  // Renderizado del componente
  // =========================================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="nueva-programacion-content">
          <div className="loading-container">
            <h2>Cargando datos...</h2>
            <div className="spinner"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="nueva-programacion-content">
        <div className="page-header">
          <div>
            <h2>Panel de Gestión</h2>
            <h1>{isEditMode ? 'Editar Programación' : 'Nueva Programación'}</h1>
          </div>
          <Link
            to="/gestora"
            className="back-button"
            style={{
              backgroundColor: colors.secondary,
              color: "white",
              textDecoration: "none",
            }}
          >
            Volver al Dashboard
          </Link>
        </div>

        {/* Mostrar mensajes de error o éxito */}
        {error && <ErrorMessage message={error} />}
        {success && <SuccessMessage message={success} />}

        <form onSubmit={handleSubmit} className="programacion-form">
          {/* Sección 1: Tipo de Actividad */}
          <div className="form-section">
            <h3>Tipo de Actividad</h3>
                <div className="form-grid">
                  <div className="form-group">
                <label htmlFor="actividad">Tipo de Actividad *</label>
                    <select
                  id="actividad"
                  value={actividadSeleccionada}
                  onChange={(e) => setActividadSeleccionada(e.target.value)}
                      required
                    >
                  <option value="">Selecciona una actividad</option>
                  {actividades.map((actividad) => (
                    <option key={actividad.act_id} value={actividad.act_id}>
                      {actividad.act_tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                <label htmlFor="modalidad">Modalidad *</label>
                    <select
                  id="modalidad"
                  value={modalidadSeleccionada}
                  onChange={(e) => setModalidadSeleccionada(e.target.value)}
                      required
                    >
                  <option value="">Selecciona una modalidad</option>
                  {modalidades.map((modalidad) => (
                    <option key={modalidad.mod_id} value={modalidad.mod_id}>
                      {modalidad.mod_nombre}
                        </option>
                      ))}
                    </select>
              </div>
            </div>
                  </div>

          {/* Sección 2: Programa y Ruta */}
          {actividadSeleccionada && (
            <div className="form-section">
              <h3>Programa y Ruta</h3>
              <div className="form-grid">
                  <div className="form-group">
                  <label htmlFor="programa">Programa *</label>
                    <select
                    id="programa"
                    value={programaSeleccionado}
                    onChange={(e) => {
                      setProgramaSeleccionado(e.target.value);
                      setRutaSeleccionada(""); // Reset ruta when programa changes
                    }}
                      required
                    >
                    <option value="">Selecciona un programa</option>
                    {programas.map((programa) => (
                      <option key={programa.prog_id} value={programa.prog_id}>
                        {programa.prog_nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                {programaSeleccionado && (
                  <div className="form-group">
                    <label htmlFor="ruta">Ruta *</label>
                    <select
                      id="ruta"
                      value={rutaSeleccionada}
                      onChange={(e) => setRutaSeleccionada(e.target.value)}
                      required
                    >
                      <option value="">Selecciona una ruta</option>
                      {obtenerRutasDelPrograma().map((ruta) => (
                        <option key={ruta.pr_id} value={ruta.pr_id}>
                          {ruta.rut_nombre}
                        </option>
                      ))}
                    </select>
                    {/* Mostrar sectores asociados a la ruta seleccionada */}
                    {rutaSeleccionada && obtenerSectoresDeRuta().length > 0 && (
  <div className="form-group">
    <label htmlFor="sector">Sector *</label>
    <select
      id="sector"
      value={sectorSeleccionado}
      onChange={e => setSectorSeleccionado(e.target.value)}
      required
    >
      <option value="">Selecciona un sector</option>
      {obtenerSectoresDeRuta().map(sector => (
        <option key={sector.sec_cod} value={sector.sec_cod}>
          {sector.sec_nombre}
        </option>
      ))}
    </select>
  </div>
)}
                  </div>
                )}

                  <div className="form-group">
                  <label htmlFor="contrato">Contrato OAMP *</label>
                    <select
                    id="contrato"
                    value={contratoOAMP}
                    onChange={(e) => handleContratoChange(e.target.value)}
                      required
                    >
                    <option value="">Selecciona un contrato</option>
                    {contratos.map((contrato) => (
                      <option key={contrato.oamp} value={contrato.oamp}>
                        {formatearNombreDropdown(contrato)}
                      </option>
                    ))}
                    </select>
                  </div>
                  </div>
            </div>
          )}

          {/* Sección 3: Información Básica */}
          {rutaSeleccionada && (
            <div className="form-section">
              <h3>Información Básica</h3>
              <div className="form-grid">
                  <div className="form-group">
                  <label htmlFor="tematica">Temática *</label>
                    <input
                    type="text"
                    id="tematica"
                    value={tematica}
                    onChange={(e) => setTematica(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="mes">Mes *</label>
                    <select
                    id="mes"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                        required
                      >
                    <option value="">Selecciona un mes</option>
                    <option value="Enero">Enero</option>
                    <option value="Febrero">Febrero</option>
                    <option value="Marzo">Marzo</option>
                    <option value="Abril">Abril</option>
                    <option value="Mayo">Mayo</option>
                    <option value="Junio">Junio</option>
                    <option value="Julio">Julio</option>
                    <option value="Agosto">Agosto</option>
                    <option value="Septiembre">Septiembre</option>
                    <option value="Octubre">Octubre</option>
                    <option value="Noviembre">Noviembre</option>
                    <option value="Diciembre">Diciembre</option>
                      </select>
                    </div>

                  <div className="form-group">
                  <label htmlFor="fechaFormacion">Fecha de Formación *</label>
                    <input
                    type="date"
                    id="fechaFormacion"
                    value={fechaFormacion}
                    onChange={(e) => setFechaFormacion(e.target.value)}
                    required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="horaInicio">Hora Inicio *</label>
                    <select
                    id="horaInicio"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                      required
                    >
                      <option value="">Selecciona hora de inicio</option>
                      <option value="01:00">01:00 AM</option>
                      <option value="02:00">02:00 AM</option>
                      <option value="03:00">03:00 AM</option>
                      <option value="04:00">04:00 AM</option>
                      <option value="05:00">05:00 AM</option>
                      <option value="06:00">06:00 AM</option>
                      <option value="07:00">07:00 AM</option>
                      <option value="08:00">08:00 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                      <option value="19:00">07:00 PM</option>
                      <option value="20:00">08:00 PM</option>
                      <option value="21:00">09:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="23:00">11:00 PM</option>
                    </select>
                  </div>

                  <div className="form-group">
                  <label htmlFor="horaFin">Hora Fin *</label>
                    <select
                    id="horaFin"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                      required
                    >
                      <option value="">Selecciona hora de fin</option>
                      <option value="01:00">01:00 AM</option>
                      <option value="02:00">02:00 AM</option>
                      <option value="03:00">03:00 AM</option>
                      <option value="04:00">04:00 AM</option>
                      <option value="05:00">05:00 AM</option>
                      <option value="06:00">06:00 AM</option>
                      <option value="07:00">07:00 AM</option>
                      <option value="08:00">08:00 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                      <option value="19:00">07:00 PM</option>
                      <option value="20:00">08:00 PM</option>
                      <option value="21:00">09:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                      <option value="23:00">11:00 PM</option>
                    </select>
                  </div>

                  <div className="form-group">
                  <label htmlFor="horasDictar">Horas a Dictar *</label>
                    <input
                    type="number"
                    id="horasDictar"
                    value={horasDictar}
                    onChange={(e) => setHorasDictar(e.target.value)}
                    min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="coordinadorCCB">Coordinador CCB</label>
                    <input
                      type="text"
                    id="coordinadorCCB"
                    value={coordinadorCCB}
                    onChange={(e) => setCoordinadorCCB(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="direccion">Dirección *</label>
                    <input
                      type="text"
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="enlace">Enlace Virtual</label>
                    <input
                    type="url"
                    id="enlace"
                    value={enlace}
                    onChange={(e) => setEnlace(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="codigoAgenda">Código Agenda *</label>
                    <input
                    type="number"
                    id="codigoAgenda"
                    value={codigoAgenda}
                    onChange={(e) => setCodigoAgenda(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="dependencia">Dependencia *</label>
                    <input
                    type="text"
                    id="dependencia"
                    value={dependencia}
                    onChange={(e) => setDependencia(e.target.value)}
                      required
                    />
                  </div>
              </div>
            </div>
          )}

          {/* Sección 4: Campos específicos para asesorías individuales */}
          {esActividadIndividual() && rutaSeleccionada && (
            <div className="form-section">
              <h3>Información del Empresario (Asesoría Individual)</h3>
              <div className="form-grid">
                  <div className="form-group">
                  <label htmlFor="nombreEmpresario">Nombre del Empresario *</label>
                    <input
                    type="text"
                    id="nombreEmpresario"
                    value={nombreEmpresario}
                    onChange={(e) => setNombreEmpresario(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                  <label htmlFor="identificacionEmpresario">Identificación del Empresario *</label>
                    <input
                    type="text"
                    id="identificacionEmpresario"
                    value={identificacionEmpresario}
                    onChange={(e) => setIdentificacionEmpresario(e.target.value)}
                      required
                    />
                  </div>
              </div>
            </div>
          )}

          {/* Sección 5: Región (opcional) */}
          {rutaSeleccionada && (
            <div className="form-section">
              <h3>Región (Opcional)</h3>
                <div className="form-grid">
                  <div className="form-group">
                  <label htmlFor="region">Región</label>
                    <select
                    id="region"
                    value={regionSeleccionada}
                    onChange={(e) => setRegionSeleccionada(e.target.value)}
                  >
                    <option value="">Sin región específica</option>
                    {regiones.map((region) => (
                      <option key={region.reg_id} value={region.reg_id}>
                        Región {region.reg_id}
    </option>
  ))}
</select>
                  </div>

                {regionSeleccionada && (
                  <div className="form-group">
                    <label htmlFor="municipio">Municipio</label>
                    <select
                      id="municipio"
                      value={municipioSeleccionado}
                      onChange={(e) => setMunicipioSeleccionado(e.target.value)}
                    >
                      <option value="">Selecciona un municipio</option>
                      {municipios.map((municipio) => (
                        <option key={municipio.mun_id} value={municipio.mun_nombre}>
                          {municipio.mun_nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección 6: Valores Calculados */}
          {horasDictar && (
            <div className="form-section">
              <h3>Valores Calculados</h3>
              <div className="form-grid">
                  <div className="form-group">
                  <label>Horas a Pagar</label>
                  <input type="text" value={horasPagar} readOnly />
                  </div>

                  <div className="form-group">
                  <label>Horas a Cobrar</label>
                  <input type="text" value={horasCobrar} readOnly />
                  </div>

                  <div className="form-group">
                  <label>Valor por Hora</label>
                  <input type="text" value={`$${parseInt(valorHora || 0).toLocaleString()}`} readOnly />
                  </div>

                  <div className="form-group">
                  <label>Valor Total a Pagar</label>
                  <input type="text" value={`$${parseInt(valorTotalPagar || 0).toLocaleString()}`} readOnly />
                  </div>

                  <div className="form-group">
                  <label>Valor Total a Cobrar CCB</label>
                  <input type="text" value={`$${parseInt(valorTotalCobrar || 0).toLocaleString()}`} readOnly />
                  </div>
              </div>
            </div>
          )}

          {/* Sección 7: Información Adicional */}
          {rutaSeleccionada && (
            <div className="form-section">
              <h3>Información Adicional</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="entregables">Entregables</label>
                  <textarea
                    id="entregables"
                    value={entregables}
                    onChange={(e) => setEntregables(e.target.value)}
                    rows="3"
                    />
                  </div>

                <div className="form-group full-width">
                  <label htmlFor="observaciones">Observaciones</label>
                  <textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    />
                  </div>
              </div>
            </div>
          )}

          {/* Sección nueva: Información del Consultor Seleccionado */}
          {consultorSeleccionado && (
            <div className="form-section consultor-info-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0 }}>📋 Información del Consultor Asignado</h3>
                <button 
                  type="button"
                  onClick={debugConsultorActual}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🔍 Debug Datos
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombres Completos</label>
                  <input
                    type="text" 
                    value={consultorSeleccionado.nombre_completo || 'Nombre no disponible'} 
                    readOnly 
                    style={{ backgroundColor: consultorSeleccionado.nombre_completo ? '#e3f2fd' : '#ffebee' }}
                  />
                </div>

                <div className="form-group">
                  <label>Cédula</label>
                  <input
                    type="text" 
                    value={consultorSeleccionado.cedula || 'No disponible'} 
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={consultorSeleccionado.usu_telefono} 
                    readOnly
                    style={{ backgroundColor: consultorSeleccionado.usu_telefono === 'No especificado' ? '#fff3e0' : '#e3f2fd' }}
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={consultorSeleccionado.usu_direccion} 
                    readOnly
                    style={{ backgroundColor: consultorSeleccionado.usu_direccion === 'No especificada' ? '#fff3e0' : '#e3f2fd' }}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Área de Conocimiento</label>
                  <input
                    type="text"
                    value={consultorSeleccionado.areaConocimiento} 
                    readOnly 
                    style={{ backgroundColor: consultorSeleccionado.areaConocimiento === 'No especificada' ? '#fff3e0' : '#e3f2fd' }}
                  />
                </div>

                <div className="form-group">
                  <label>Valor Total del Contrato</label>
                  <input
                    type="text"
                    value={`$${parseInt(consultorSeleccionado.oamp_valor_total || 0).toLocaleString()}`} 
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Generación Contrato</label>
                  <input
                    type="text"
                    value={consultorSeleccionado.oamp_fecha_generacion !== 'Invalid Date' ? 
                      new Date(consultorSeleccionado.oamp_fecha_generacion).toLocaleDateString('es-CO') : 
                      'Fecha no disponible'} 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sección 8: Sector */}
          {rutaSeleccionada && obtenerSectoresDeRuta().length > 0 && (
            <div className="form-section">
              <h3>Sector</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="sector">Sector *</label>
                  <select
                    id="sector"
                    value={sectorSeleccionado}
                    onChange={e => setSectorSeleccionado(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un sector</option>
                    {obtenerSectoresDeRuta().map(sector => (
                      <option key={sector.sec_cod} value={sector.sec_cod}>
                        {sector.sec_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botón de envío */}
          {rutaSeleccionada && (
            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                style={{ backgroundColor: colors.primary }}
              >
                {isEditMode ? 'Actualizar Programación' : 'Crear Programación'}
              </button>
          </div>
        )}
        </form>
      </div>
    </DashboardLayout>
  );
}

export default NuevaProgramacionPage;