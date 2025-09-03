CREATE DATABASE automatizacion2;
USE automatizacion2;
/*
Tablas menos dependientes inicio
*/
-- Tabla de cuentas
CREATE TABLE cuentas (
	usu_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_correo VARCHAR(100) UNIQUE NOT NULL,
    usu_contraseña VARCHAR(255) NOT NULL,
    usu_tipo ENUM('Administrador','Consultor','Profesional','Reclutador') DEFAULT 'Consultor' NOT NULL,
    usu_fecha_registro TIMESTAMP NOT NULL,
    usu_activo BOOL NOT NULL
);
-- Tabla de habilidades
CREATE TABLE habilidades (
	hab_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    hab_nombre VARCHAR(100) NOT NULL,
    hab_categoria VARCHAR(100) NOT NULL,
    hab_descripcion VARCHAR(100) NOT NULL,
    hab_nivel_importancia INT NOT NULL
);
-- Tabla de modalidades
CREATE TABLE modalidades (
  mod_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  mod_nombre VARCHAR(100) NOT NULL
);

-- Tabla de actividades
CREATE TABLE actividades (
	act_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    act_tipo VARCHAR(255) NOT NULL
);
-- Tabla de areas_conocimiento
CREATE TABLE areas_conocimiento (
	are_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    are_descripcion TEXT NOT NULL
);
-- Tabla de regiones
CREATE TABLE regiones (
	reg_id VARCHAR(50) PRIMARY KEY NOT NULL
);

-- Tabla de programas
CREATE TABLE programas (
	prog_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    prog_nombre VARCHAR(255) NOT NULL,
    prog_total_horas FLOAT NOT NULL
);

/*
Tablas menos dependientes final
*/

/*
Tablas mas dependientes inicio
*/
-- Tabla de municipios
CREATE TABLE municipios (
	mun_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    reg_id VARCHAR(50),
    mun_nombre VARCHAR(255),
    FOREIGN KEY (reg_id) REFERENCES regiones(reg_id) ON DELETE CASCADE
);
-- Tabla de valor_horas_region
CREATE TABLE valor_horas_region (
  val_reg_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  reg_id VARCHAR(50) NOT NULL,
  val_reg_hora_base INT NOT NULL,
  val_reg_traslado INT NOT NULL,
  val_reg_sin_dictar INT NOT NULL,
  val_reg_dos_horas INT NOT NULL,
  val_reg_tres_horas INT NOT NULL,
  val_reg_cuatro_mas_horas INT NOT NULL,
   FOREIGN KEY (reg_id) REFERENCES regiones(reg_id) ON DELETE CASCADE
);
-- Tabla de consultores
CREATE TABLE usuarios_info (
  usu_cedula BIGINT NOT NULL PRIMARY KEY,
  usu_id INT NOT NULL,  -- Relación con cuentas
  are_id INT NOT NULL,
  usu_primer_nombre VARCHAR(255) NOT NULL,
  usu_segundo_nombre VARCHAR(255) NULL,
  usu_primer_apellido VARCHAR(255) NOT NULL,
  usu_segundo_apellido VARCHAR(255) NOT NULL,
  usu_telefono VARCHAR(255) NOT NULL,
  usu_direccion VARCHAR(255) NOT NULL,
  FOREIGN KEY (usu_id) REFERENCES cuentas(usu_id) ON DELETE CASCADE,
  FOREIGN KEY (are_id) REFERENCES areas_conocimiento(are_id) ON DELETE CASCADE
);
-- Tabla para asignar consultores específicos a gestoras/profesionales
CREATE TABLE gestora_consultores (
    gc_id INT AUTO_INCREMENT PRIMARY KEY,
    gestora_cedula BIGINT NOT NULL, -- Cédula de la gestora/profesional
    consultor_cedula BIGINT NOT NULL, -- Cédula del consultor asignado
    gc_fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gc_activo BOOLEAN DEFAULT TRUE,
    gc_observaciones TEXT,
    
    -- Foreign keys
    FOREIGN KEY (gestora_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (consultor_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    
    -- Evitar duplicación: una gestora no puede tener el mismo consultor asignado dos veces activo
    UNIQUE KEY unique_gestora_consultor_activo (gestora_cedula, consultor_cedula, gc_activo)
);
-- Tabla de hojas de vida
CREATE TABLE hojas_de_vida (
	hv_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (Consultores)
    hv_archivo LONGBLOB NOT NULL,
    hv_formato VARCHAR(50) NOT NULL,
    hv_fecha_carga TIMESTAMP NOT NULL,
    hv_score_ia FLOAT NOT NULL,
    hv_resumen_automatico TEXT NOT NULL,
    hv_verificado BOOL NOT NULL,
	FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE
);
-- Tabla de notificaciones
CREATE TABLE notificaciones (
	not_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (llega a los consultores)
    not_titulo VARCHAR(255) NOT NULL,
    not_mensaje VARCHAR(255) NOT NULL,
    not_fecha_hora TIMESTAMP NOT NULL,
    not_leida BOOL NOT NULL,
    not_tipo VARCHAR(100) NOT NULL,
	FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE
);
-- Tabla de configuracion_IA (reclutador configura la ia que vendra de n8n)
CREATE TABLE configuraciones_ia (
	confi_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (reclutadores)
    confi_nombre_parametro TEXT NOT NULL,
    confi_valor VARCHAR(255) NOT NULL,
    confi_descripcion TEXT NOT NULL,
    confi_ultima_modificacion TIMESTAMP NOT NULL,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE
);
-- Tabla de habilidad hoja de vida
CREATE TABLE habilidades_cv (
	hab_cv_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    hv_id INT NOT NULL, -- Relación con hojas_de_vida
    hab_id INT NOT NULL, -- Relación con habilidades
    hab_cv_nivel_dominio INT NOT NULL,
    hab_cv_descripcion VARCHAR(255) NOT NULL,
    hab_cv_validada BOOL NOT NULL,
    FOREIGN KEY (hv_id) REFERENCES hojas_de_vida(hv_id) ON DELETE CASCADE,
    FOREIGN KEY (hab_id) REFERENCES habilidades(hab_id) ON DELETE CASCADE
);
-- Tabla de favoritos
CREATE TABLE favoritos (
	fav_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (reclutadores)
    hv_id INT NOT NULL, -- Relación con hojas_de_vida
    fav_notas TEXT NOT NULL,
    fav_fecha_guardado TIMESTAMP NOT NULL,
    fav_carpeta VARCHAR(100) NOT NULL,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (hv_id) REFERENCES hojas_de_vida(hv_id) ON DELETE CASCADE
);
 -- Tabla de sectores
CREATE TABLE sectores (
	sec_cod INT PRIMARY KEY NOT NULL,
    are_id INT NOT NULL,
    sec_nombre VARCHAR(255) NOT NULL,
    sec_total_horas INT NOT NULL,
    FOREIGN KEY (are_id) REFERENCES areas_conocimiento(are_id) ON DELETE CASCADE
);
-- Tabla de valor_horas
CREATE TABLE valor_horas (
  val_hor_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  mod_id INT NOT NULL, -- Relación con modalidades
  val_hor_clasificacion VARCHAR(100) NOT NULL, -- Ej. Virtual, Presencial
  val_hor_precio INT NOT NULL,
  FOREIGN KEY (mod_id) REFERENCES modalidades(mod_id) ON DELETE CASCADE
);
-- Tabla de rutas
CREATE TABLE rutas (
	rut_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    val_hor_id INT NOT NULL,
    rut_nombre VARCHAR(255) NOT NULL,
    rut_descripcion TEXT NOT NULL,
    rut_candidatos INT NOT NULL,
    rut_total_horas FLOAT NOT NULL,
    rut_promedio_horas_candidato FLOAT,
    FOREIGN KEY (val_hor_id) REFERENCES valor_horas(val_hor_id) ON DELETE CASCADE
);
-- Tabla de rutas secotor
CREATE TABLE ruta_sector (
  rs_id INT AUTO_INCREMENT PRIMARY KEY,
  rut_id INT NOT NULL,
  sec_cod INT NOT NULL,
  FOREIGN KEY (rut_id) REFERENCES rutas(rut_id),
  FOREIGN KEY (sec_cod) REFERENCES sectores(sec_cod)
);
-- Tabla de vacantes
CREATE TABLE vacantes (
	vac_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (reclutadores)
    rut_id INT NOT NULL, -- Relación con rutas
    vac_titulo VARCHAR(255) NOT NULL,
    vac_descripcion TEXT NOT NULL,
    vac_renumeracion FLOAT,
    vac_estado ENUM('Borrador', 'Publicada', 'Cerrada', 'Cancelada'),
    vac_fecha_publicacion DATE,
    vac_fecha_limite_postulacion DATE,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (rut_id) REFERENCES rutas(rut_id) ON DELETE CASCADE
);
-- Tala de requisitos
CREATE TABLE requisitos (
	req_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    vac_id INT NOT NULL, -- Relación con vacantes
    hab_id INT NOT NULL, -- Relación con habilidades
    req_nivel_requerido INT NOT NULL,
    req_obligatorio BOOL NOT NULL,
    req_ponderacion INT NOT NULL,
    FOREIGN KEY (vac_id) REFERENCES vacantes(vac_id) ON DELETE CASCADE,
    FOREIGN KEY (hab_id) REFERENCES habilidades(hab_id) ON DELETE CASCADE
);
-- Tala de postulaciones
CREATE TABLE postulaciones (
	pos_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    vac_id INT NOT NULL, -- Relación con vacantes
    hv_id INT NOT NULL, -- Relación con hojas_de_vida
    pos_fecha_postulacion TIMESTAMP NOT NULL,
    pos_estado ENUM('Pendiente', 'Revisada', 'Preseleccionada', 'Rechazada', 'Aprobada') NOT NULL,
    pos_puntuacion_match FLOAT NOT NULL,
    pos_comentarios_reclutador TEXT NOT NULL,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (vac_id) REFERENCES vacantes(vac_id) ON DELETE CASCADE,
    FOREIGN KEY (hv_id) REFERENCES hojas_de_vida(hv_id) ON DELETE CASCADE
);
-- Tabla de matchs
CREATE TABLE matchs (
	mat_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    pos_id INT NOT NULL, -- Relación con postulaciones
    req_id INT NOT NULL, -- Relación con requisitos
    mat_puntuacion FLOAT NOT NULL,
    mat_observacion TEXT NOT NULL,
	FOREIGN KEY (pos_id) REFERENCES postulaciones(pos_id) ON DELETE CASCADE,
    FOREIGN KEY (req_id) REFERENCES requisitos(req_id) ON DELETE CASCADE
);
-- Tabla de entrevistas (reclutador crea la entrevista y le llega una notificacion o correo al consultor de la entrevista)
CREATE TABLE entrevistas (
	vis_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    pos_id INT NOT NULL, -- Relación con postulaciones
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultor al que se le hara la entrevista)
    vis_fecha_hora TIMESTAMP NOT NULL,
    vis_modalidad VARCHAR(100) NOT NULL,
    vis_plataforma VARCHAR(100) NOT NULL,
    vis_link_acceso VARCHAR(100) NOT NULL,
    vis_estado ENUM('Programada', 'Realizada', 'Cancelada', 'Reprogramada') NOT NULL,
    vis_resultado VARCHAR(255) NOT NULL,
    vis_observaciones TEXT NOT NULL,
    FOREIGN KEY (pos_id) REFERENCES postulaciones(pos_id) ON DELETE CASCADE,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE
);
-- Tabla de contratos
CREATE TABLE contratos (
	oamp INT PRIMARY KEY NOT NULL,
	pos_id INT NULL, -- Relación con postulaciones
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    oamp_consecutivo VARCHAR(255) NOT NULL,
    oamp_terminos TEXT NULL,
    oamp_fecha_generacion TIMESTAMP NOT NULL,
    oamp_estado ENUM('Borrador', 'Enviado', 'Rechazado', 'Cancelado') NOT NULL,
    oamp_valor_total FLOAT NOT NULL,
    oamp_documento_firmado LONGBLOB NULL,
    FOREIGN KEY (pos_id) REFERENCES postulaciones(pos_id) ON DELETE CASCADE,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE
);

-- Tabla de responsable_rutas (optimizada sin duplicación)
CREATE TABLE responsable_rutas (
    rr_id INT AUTO_INCREMENT PRIMARY KEY,
    usu_id INT NOT NULL, -- Relación con cuentas (profesionales)
    rut_id INT NOT NULL, -- Relación con rutas
    rr_rol ENUM('Profesional', 'Auxiliar') DEFAULT 'Profesional',
    rr_fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rr_activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usu_id) REFERENCES cuentas(usu_id) ON DELETE CASCADE,
    FOREIGN KEY (rut_id) REFERENCES rutas(rut_id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_ruta (usu_id, rut_id)
);
-- Tabla de progrma con rutas
CREATE TABLE programa_ruta (
  pr_id INT AUTO_INCREMENT PRIMARY KEY,
  prog_id INT NOT NULL,
  rut_id INT NOT NULL,
  FOREIGN KEY (prog_id) REFERENCES programas(prog_id) ON DELETE CASCADE,
  FOREIGN KEY (rut_id) REFERENCES rutas(rut_id) ON DELETE CASCADE
);
-- Tabla de progrmaciones_grupales
CREATE TABLE programaciones_grupales (
	pro_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    pr_id INT NOT NULL, -- Relación con programa_ruta
    val_reg_id INT, -- Relación con valor_horas_region
    oamp INT NOT NULL, -- Relación con contratos
    act_id INT NOT NULL, -- Relación con actividades
    mod_id INT NOT NULL, -- Relación con modalidades
    pro_codigo_agenda INT NOT NULL,
    pro_tematica VARCHAR(255) NOT NULL,
    pro_mes VARCHAR(50) NOT NULL,
    pro_fecha_formacion DATE NOT NULL,
    pro_hora_inicio TIME NOT NULL,
    pro_hora_fin TIME NOT NULL,
    pro_horas_dictar INT NOT NULL,
    pro_coordinador_ccb VARCHAR(255),
    pro_direccion VARCHAR(255) NOT NULL,
    pro_enlace VARCHAR(255) NOT NULL,
    pro_estado ENUM('Programado', 'Realizada', 'Cancelada', 'Pendiente', 'Evidencias Aceptadas', 'Evidencias Devueltas'), 
    pro_numero_hora_pagar INT NOT NULL,
    pro_numero_hora_cobrar INT NOT NULL,
    pro_valor_hora FLOAT NOT NULL,
    pro_valor_total_hora_pagar FLOAT NOT NULL,
    pro_valor_total_hora_ccb FLOAT NOT NULL,
    pro_entregables TEXT NOT NULL,
    pro_dependencia VARCHAR(50) NOT NULL,
    pro_observaciones TEXT NOT NULL,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES modalidades(mod_id) ON DELETE CASCADE,
    FOREIGN KEY (pr_id) REFERENCES programa_ruta(pr_id) ON DELETE CASCADE,
    FOREIGN KEY (val_reg_id) REFERENCES valor_horas_region(val_reg_id) ON DELETE CASCADE,
    FOREIGN KEY (oamp) REFERENCES contratos(oamp) ON DELETE CASCADE,
    FOREIGN KEY (act_id) REFERENCES actividades(act_id) ON DELETE CASCADE
);
-- Tabla de programaciones_individuales
CREATE TABLE programaciones_individuales (
	proin_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    pr_id INT NOT NULL, -- Relación con programa_ruta
    val_reg_id INT, -- Relación con valor_horas_region
    oamp INT NOT NULL, -- Relación con contratos
    act_id INT NOT NULL, -- Relación con actividades
    mod_id INT NOT NULL, -- Relación con modalidad
    proin_codigo_agenda INT NOT NULL,
    proin_tematica VARCHAR(255) NOT NULL,
    proin_mes VARCHAR(50) NOT NULL,
    proin_fecha_formacion DATE NOT NULL,
    proin_hora_inicio TIME NOT NULL,
    proin_hora_fin TIME NOT NULL,
    proin_horas_dictar INT NOT NULL,
    proin_coordinador_ccb VARCHAR(255),
    proin_direccion VARCHAR(255) NOT NULL,
    proin_enlace VARCHAR(255) NOT NULL,
    proin_nombre_empresario VARCHAR(255) NOT NULL,
    proin_identificacion_empresario VARCHAR(11) NOT NULL,
    proin_estado ENUM('Programado', 'Realizada', 'Cancelada', 'Pendiente', 'Evidencias Aceptadas', 'Evidencias Devueltas') NOT NULL DEFAULT 'Programado',
    proin_numero_hora_pagar INT NOT NULL,
    proin_numero_hora_cobrar INT NOT NULL,
    proin_valor_hora FLOAT NOT NULL,
    proin_valor_total_hora_pagar FLOAT NOT NULL,
    proin_valor_total_hora_ccb FLOAT NOT NULL,
    proin_entregables TEXT NOT NULL,
    proin_dependencia VARCHAR(50) NOT NULL,
    proin_observaciones TEXT NOT NULL,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES modalidades(mod_id) ON DELETE CASCADE,
    FOREIGN KEY (pr_id) REFERENCES programa_ruta(pr_id) ON DELETE CASCADE,
    FOREIGN KEY (val_reg_id) REFERENCES valor_horas_region(val_reg_id) ON DELETE CASCADE,
    FOREIGN KEY (oamp) REFERENCES contratos(oamp) ON DELETE CASCADE,
    FOREIGN KEY (act_id) REFERENCES actividades(act_id) ON DELETE CASCADE
);

-- Tabla de evidencias_grupales
CREATE TABLE evidencias_grupales (
	evi_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    pro_id INT NOT NULL, -- Relacion con programaciones_grupales
    rr_id INT NOT NULL, -- Relación con responsable_rutas
    evi_mes VARCHAR(100) NOT NULL,
    evi_fecha TIMESTAMP NOT NULL,
    evi_hora_inicio TIMESTAMP NOT NULL,
    evi_hora_fin TIMESTAMP NOT NULL,
    evi_horas_dictar INT NOT NULL,
    evi_valor_hora FLOAT NOT NULL,
    evi_valor_total_horas FLOAT NOT NULL,
    evi_tematica_dictada VARCHAR(100) NOT NULL,
    evi_numero_asistentes INT NOT NULL,
    evi_direccion VARCHAR(255) NOT NULL,
    evi_estado ENUM('Pendiente', 'Realizada', 'Cancelada', 'Evidencias Aceptadas', 'Evidencias Devueltas') NOT NULL DEFAULT 'Pendiente',
    evi_evidencias LONGBLOB NOT NULL, -- son archivo pdf con las fotografias
	evi_nombre_archivo VARCHAR(255),
    evi_tipo_archivo VARCHAR(100),
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (rr_id) REFERENCES responsable_rutas(rr_id) ON DELETE CASCADE,
    FOREIGN KEY (pro_id) REFERENCES programaciones_grupales(pro_id) ON DELETE CASCADE
);
-- Tabla de evidencias_individuales
CREATE TABLE evidencias_individuales (
	eviin_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    proin_id INT NOT NULL, -- Relacion con programaciones_individuales
    rr_id INT NOT NULL, -- Relación con responsable_rutas
    eviin_mes VARCHAR(100) NOT NULL,
    eviin_fecha TIMESTAMP NOT NULL,
    eviin_hora_inicio TIMESTAMP NOT NULL,
    eviin_hora_fin TIMESTAMP NOT NULL,
    eviin_horas_dictar INT NOT NULL,
    eviin_valor_hora FLOAT NOT NULL,
    eviin_valor_total_horas FLOAT NOT NULL,
    eviin_tematica_dictada VARCHAR(100) NOT NULL,
    eviin_numero_asistentes INT NOT NULL,
    eviin_direccion VARCHAR(255) NOT NULL,
    eviin_estado ENUM('Pendiente', 'Realizada', 'Cancelada', 'Evidencias Aceptadas', 'Evidencias Devueltas') NOT NULL DEFAULT 'Pendiente',
    eviin_razon_social INT NOT NULL,
    eviin_nombre_asesorado VARCHAR(255) NOT NULL,
    eviin_identificacion_asesorado INT NOT NULL,
    eviin_evidencias LONGBLOB NOT NULL, -- son archivo pdf con las fotografias
    eviin_nombre_archivo VARCHAR(255),
    eviin_tipo_archivo VARCHAR(100),
    evi_pantallazo_avanza LONGBLOB NULL,
    eviin_pantallazo_nombre VARCHAR(255),
    eviin_pantallazo_tipo VARCHAR(100),
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (rr_id) REFERENCES responsable_rutas(rr_id) ON DELETE CASCADE,
    FOREIGN KEY (proin_id) REFERENCES programaciones_individuales(proin_id) ON DELETE CASCADE
);
-- Tabla de valoracion
#Tabla de valoracion para las evidencias del consultor hecha por el profesional responsable
CREATE TABLE valoraciones (
	val_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    rr_id INT NOT NULL, -- Relación con responsable_rutas
    evi_id INT NULL,
    eviin_id INT NULL,
    val_puntuacion FLOAT NOT NULL,
    val_observaciones TEXT NOT NULL,
    FOREIGN KEY (rr_id) REFERENCES responsable_rutas(rr_id),
    FOREIGN KEY (evi_id) REFERENCES evidencias_grupales(evi_id),
    FOREIGN KEY (eviin_id) REFERENCES evidencias_individuales(eviin_id),
    UNIQUE KEY uq_valoracion_grupal (rr_id, evi_id),
	UNIQUE KEY uq_valoracion_individual (rr_id, eviin_id)
);
CREATE TABLE informes (
	info_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    oamp INT NOT NULL, -- Relación con contratos
    usu_cedula BIGINT NOT NULL, -- Relación con usuarios_info (consultores)
    evi_id INT, -- NUEVO: Relación con evidencias_grupales
    eviin_id INT, -- NUEVO: Relación con evidencias_individuales
    info_seg_mes VARCHAR(50) NOT NULL,
    info_seg_ejecucion_horas INT NOT NULL,
    info_valor_total_contrato FLOAT NOT NULL,
    info_valor_facturar FLOAT NOT NULL, -- (VALOR A FACTURAR)
    info_ejecutado_acumulado FLOAT NOT NULL,
    info_valor_saldo_contrato FLOAT NOT NULL,
    info_total_horas FLOAT NOT NULL,
    info_horas_facturadas FLOAT NOT NULL, -- (HORAS FACTURADAS)
    info_horas_ejecutadas_acumulado FLOAT NOT NULL,
    info_horas_saldo_contrato FLOAT NOT NULL,
    FOREIGN KEY (oamp) REFERENCES contratos(oamp) ON DELETE CASCADE,
    FOREIGN KEY (usu_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (evi_id) REFERENCES evidencias_grupales(evi_id) ON DELETE SET NULL,
    FOREIGN KEY (eviin_id) REFERENCES evidencias_individuales(eviin_id) ON DELETE SET NULL
);
-- Tabla para almacenar el cronograma de fechas límite de entrega de informes
CREATE TABLE cronograma_informes_ccb (
    cronograma_id INT AUTO_INCREMENT PRIMARY KEY,
    mes_ejecucion VARCHAR(20) NOT NULL, -- abril, mayo, junio, etc.
    fecha_maxima_envio_ccb DATE NOT NULL, -- Fecha máxima de envío de informes a CCB
    fecha_maxima_revision_ccb DATE NOT NULL, -- Fecha máxima de revisión de informes por CCB
    fecha_maxima_subsanacion DATE NOT NULL, -- Fecha máxima de subsanación
    fecha_maxima_aprobacion_final DATE NOT NULL, -- Fecha máxima aprobación final CCB
    fecha_maxima_facturacion DATE NOT NULL, -- Fecha máxima de facturación
    descripcion TEXT NULL, -- Descripción adicional del cronograma
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_mes_ejecucion (mes_ejecucion)
);

-- Tabla para gestionar las notificaciones automáticas sobre fechas límite
CREATE TABLE notificaciones_cronograma (
    notif_cron_id INT AUTO_INCREMENT PRIMARY KEY,
    cronograma_id INT NOT NULL,
    tipo_fecha ENUM('envio_ccb', 'revision_ccb', 'subsanacion', 'aprobacion_final', 'facturacion') NOT NULL,
    dias_anticipacion INT NOT NULL DEFAULT 3, -- Días de anticipación para enviar la notificación
    mensaje_plantilla TEXT NOT NULL, -- Plantilla del mensaje de notificación
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_informes_ccb(cronograma_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cronograma_tipo (cronograma_id, tipo_fecha)
);

#Triggers valoraciones
-- 4. TRIGGER: Actualiza el estado de la evidencia GRUPAL cuando se inserta/actualiza una valoración
DELIMITER $$
CREATE TRIGGER trg_after_valoracion_grupal_upsert
AFTER INSERT ON valoraciones
FOR EACH ROW
BEGIN
    IF NEW.evi_id IS NOT NULL THEN
        UPDATE evidencias_grupales
        SET evi_estado = 'Evidencias Devueltas'
        WHERE evi_id = NEW.evi_id;
    END IF;
END$$
DELIMITER ;

-- 5. TRIGGER: Actualiza el estado de la evidencia INDIVIDUAL cuando se inserta/actualiza una valoración
DELIMITER $$
CREATE TRIGGER trg_after_valoracion_individual_upsert
AFTER INSERT ON valoraciones
FOR EACH ROW
BEGIN
    IF NEW.eviin_id IS NOT NULL THEN
        UPDATE evidencias_individuales
        SET eviin_estado = 'Evidencias Devueltas'
        WHERE eviin_id = NEW.eviin_id;
    END IF;
END$$
DELIMITER ;

-- Trigger que se activa cuando se actualiza una evidencia grupal
DELIMITER $$
CREATE TRIGGER trg_after_evidencia_grupal_update_sync_programacion
AFTER UPDATE ON evidencias_grupales
FOR EACH ROW
BEGIN
    -- Si la evidencia fue aceptada, marcar la programación como 'Realizada'
    IF NEW.evi_estado = 'Evidencias Aceptadas' THEN
        UPDATE programaciones_grupales
        SET pro_estado = 'Realizada' -- El estado final que ve el consultor
        WHERE pro_id = NEW.pro_id;
    -- Si fue devuelta, marcar la programación como 'Evidencias Devueltas' para que el consultor la vea
    ELSEIF NEW.evi_estado = 'Evidencias Devueltas' THEN
        UPDATE programaciones_grupales
        SET pro_estado = 'Evidencias Devueltas'
        WHERE pro_id = NEW.pro_id;
    END IF;
END$$
DELIMITER ;

-- Trigger que se activa cuando se actualiza una evidencia individual
DELIMITER $$
CREATE TRIGGER trg_after_evidencia_individual_update_sync_programacion
AFTER UPDATE ON evidencias_individuales
FOR EACH ROW
BEGIN
    -- Si la evidencia fue aceptada, marcar la programación como 'Realizada'
    IF NEW.eviin_estado = 'Evidencias Aceptadas' THEN
        UPDATE programaciones_individuales
        SET proin_estado = 'Realizada' -- El estado final que ve el consultor
        WHERE proin_id = NEW.proin_id;
    -- Si fue devuelta, marcar la programación como 'Evidencias Devueltas'
    ELSEIF NEW.eviin_estado = 'Evidencias Devueltas' THEN
        UPDATE programaciones_individuales
        SET proin_estado = 'Evidencias Devueltas'
        WHERE proin_id = NEW.proin_id;
    END IF;
END$$
DELIMITER ;

#Trigers informe
-- Trigger que se dispara al crear una EVIDENCIA GRUPAL
DELIMITER $$
CREATE TRIGGER trg_informe_from_evidencia_grupal
AFTER INSERT ON evidencias_grupales
FOR EACH ROW
BEGIN
    -- Declaración de variables
    DECLARE v_oamp INT;
    DECLARE v_usu_cedula BIGINT;
    DECLARE v_mes VARCHAR(50);
    DECLARE v_valor_total_contrato FLOAT DEFAULT 0;
    DECLARE v_total_horas_contrato FLOAT DEFAULT 0;
    DECLARE v_horas_ejecutadas_mes FLOAT DEFAULT 0;
    DECLARE v_valor_ejecutado_mes FLOAT DEFAULT 0;
    DECLARE v_horas_ejecutadas_acumulado FLOAT DEFAULT 0;
    DECLARE v_valor_ejecutado_acumulado FLOAT DEFAULT 0;

    -- 1. Obtenemos datos clave desde la programación asociada a esta evidencia
    SELECT p.oamp, p.usu_cedula, p.pro_mes 
    INTO v_oamp, v_usu_cedula, v_mes
    FROM programaciones_grupales p 
    WHERE p.pro_id = NEW.pro_id;

    -- 2. Obtenemos datos del contrato
    SELECT COALESCE(oamp_valor_total, 0) INTO v_valor_total_contrato FROM contratos WHERE oamp = v_oamp;
    SET v_total_horas_contrato = IF(v_valor_total_contrato > 0 AND NEW.evi_valor_hora > 0, v_valor_total_contrato / NEW.evi_valor_hora, 0);

    -- 3. Calculamos los totales ACUMULADOS del contrato (sumando de ambas tablas de EVIDENCIAS)
    SELECT 
        COALESCE(SUM(horas), 0), 
        COALESCE(SUM(valor), 0)
    INTO v_horas_ejecutadas_acumulado, v_valor_ejecutado_acumulado
    FROM (
        SELECT eg.evi_horas_dictar as horas, eg.evi_valor_total_horas as valor 
        FROM evidencias_grupales eg JOIN programaciones_grupales pg ON eg.pro_id = pg.pro_id WHERE pg.oamp = v_oamp
        UNION ALL
        SELECT ei.eviin_horas_dictar, ei.eviin_valor_total_horas 
        FROM evidencias_individuales ei JOIN programaciones_individuales pi ON ei.proin_id = pi.proin_id WHERE pi.oamp = v_oamp
    ) as todas_evidencias;

    -- 4. Calculamos los totales DEL MES (sumando de ambas tablas de EVIDENCIAS)
    SELECT 
        COALESCE(SUM(horas), 0),
        COALESCE(SUM(valor), 0)
    INTO v_horas_ejecutadas_mes, v_valor_ejecutado_mes
    FROM (
        SELECT evi_horas_dictar as horas, evi_valor_total_horas as valor FROM evidencias_grupales WHERE evi_mes = v_mes AND usu_cedula = v_usu_cedula
        UNION ALL
        SELECT eviin_horas_dictar, eviin_valor_total_horas FROM evidencias_individuales WHERE eviin_mes = v_mes AND usu_cedula = v_usu_cedula
    ) as evidencias_del_mes;

    -- 5. Lógica "UPSERT"
    INSERT INTO informes (
        oamp, usu_cedula, evi_id, info_seg_mes, info_seg_ejecucion_horas,
        info_valor_total_contrato, info_valor_facturar, info_ejecutado_acumulado,
        info_valor_saldo_contrato, info_total_horas, info_horas_facturadas,
        info_horas_ejecutadas_acumulado, info_horas_saldo_contrato
    )
    VALUES (
        v_oamp, v_usu_cedula, NEW.evi_id, v_mes, v_horas_ejecutadas_mes,
        v_valor_total_contrato, v_valor_ejecutado_mes, v_valor_ejecutado_acumulado,
        v_valor_total_contrato - v_valor_ejecutado_acumulado, v_total_horas_contrato,
        v_horas_ejecutadas_mes, v_horas_ejecutadas_acumulado,
        v_total_horas_contrato - v_horas_ejecutadas_acumulado
    )
    ON DUPLICATE KEY UPDATE
        usu_cedula = v_usu_cedula,
        evi_id = NEW.evi_id,
        info_seg_ejecucion_horas = v_horas_ejecutadas_mes,
        info_valor_facturar = v_valor_ejecutado_mes,
        info_ejecutado_acumulado = v_valor_ejecutado_acumulado,
        info_valor_saldo_contrato = v_valor_total_contrato - v_valor_ejecutado_acumulado,
        info_horas_facturadas = v_horas_ejecutadas_mes,
        info_horas_ejecutadas_acumulado = v_horas_ejecutadas_acumulado,
        info_horas_saldo_contrato = v_total_horas_contrato - v_horas_ejecutadas_acumulado;
END$$
DELIMITER ;


-- Trigger que se dispara al crear una EVIDENCIA INDIVIDUAL
DELIMITER $$
CREATE TRIGGER trg_informe_from_evidencia_individual
AFTER INSERT ON evidencias_individuales
FOR EACH ROW
BEGIN
    DECLARE v_oamp INT;
    DECLARE v_usu_cedula BIGINT;
    DECLARE v_mes VARCHAR(50);
    DECLARE v_valor_total_contrato FLOAT DEFAULT 0;
    DECLARE v_total_horas_contrato FLOAT DEFAULT 0;
    DECLARE v_horas_ejecutadas_mes FLOAT DEFAULT 0;
    DECLARE v_valor_ejecutado_mes FLOAT DEFAULT 0;
    DECLARE v_horas_ejecutadas_acumulado FLOAT DEFAULT 0;
    DECLARE v_valor_ejecutado_acumulado FLOAT DEFAULT 0;

    -- 1. Obtenemos datos clave desde la programación asociada a esta evidencia
    SELECT p.oamp, p.usu_cedula, p.proin_mes 
    INTO v_oamp, v_usu_cedula, v_mes
    FROM programaciones_individuales p 
    WHERE p.proin_id = NEW.proin_id;

    -- 2. Obtenemos datos del contrato
    SELECT COALESCE(oamp_valor_total, 0) INTO v_valor_total_contrato FROM contratos WHERE oamp = v_oamp;
    SET v_total_horas_contrato = IF(v_valor_total_contrato > 0 AND NEW.eviin_valor_hora > 0, v_valor_total_contrato / NEW.eviin_valor_hora, 0);

    -- 3. Calculamos los totales ACUMULADOS del contrato (sumando de ambas tablas de EVIDENCIAS)
    SELECT 
        COALESCE(SUM(horas), 0), 
        COALESCE(SUM(valor), 0)
    INTO v_horas_ejecutadas_acumulado, v_valor_ejecutado_acumulado
    FROM (
        SELECT eg.evi_horas_dictar as horas, eg.evi_valor_total_horas as valor 
        FROM evidencias_grupales eg JOIN programaciones_grupales pg ON eg.pro_id = pg.pro_id WHERE pg.oamp = v_oamp
        UNION ALL
        SELECT ei.eviin_horas_dictar, ei.eviin_valor_total_horas 
        FROM evidencias_individuales ei JOIN programaciones_individuales pi ON ei.proin_id = pi.proin_id WHERE pi.oamp = v_oamp
    ) as todas_evidencias;

    -- 4. Calculamos los totales DEL MES (sumando de ambas tablas de EVIDENCIAS)
    SELECT 
        COALESCE(SUM(horas), 0),
        COALESCE(SUM(valor), 0)
    INTO v_horas_ejecutadas_mes, v_valor_ejecutado_mes
    FROM (
        SELECT evi_horas_dictar as horas, evi_valor_total_horas as valor FROM evidencias_grupales WHERE evi_mes = v_mes AND usu_cedula = v_usu_cedula
        UNION ALL
        SELECT eviin_horas_dictar, eviin_valor_total_horas FROM evidencias_individuales WHERE eviin_mes = v_mes AND usu_cedula = v_usu_cedula
    ) as evidencias_del_mes;

    -- 5. Lógica "UPSERT"
    INSERT INTO informes (
        oamp, usu_cedula, eviin_id, info_seg_mes, info_seg_ejecucion_horas,
        info_valor_total_contrato, info_valor_facturar, info_ejecutado_acumulado,
        info_valor_saldo_contrato, info_total_horas, info_horas_facturadas,
        info_horas_ejecutadas_acumulado, info_horas_saldo_contrato
    )
    VALUES (
        v_oamp, v_usu_cedula, NEW.eviin_id, v_mes, v_horas_ejecutadas_mes,
        v_valor_total_contrato, v_valor_ejecutado_mes, v_valor_ejecutado_acumulado,
        v_valor_total_contrato - v_valor_ejecutado_acumulado, v_total_horas_contrato,
        v_horas_ejecutadas_mes, v_horas_ejecutadas_acumulado,
        v_total_horas_contrato - v_horas_ejecutadas_acumulado
    )
    ON DUPLICATE KEY UPDATE
        usu_cedula = v_usu_cedula,
        eviin_id = NEW.eviin_id,
        info_seg_ejecucion_horas = v_horas_ejecutadas_mes,
        info_valor_facturar = v_valor_ejecutado_mes,
        info_ejecutado_acumulado = v_valor_ejecutado_acumulado,
        info_valor_saldo_contrato = v_valor_total_contrato - v_valor_ejecutado_acumulado,
        info_horas_facturadas = v_horas_ejecutadas_mes,
        info_horas_ejecutadas_acumulado = v_horas_ejecutadas_acumulado,
        info_horas_saldo_contrato = v_total_horas_contrato - v_horas_ejecutadas_acumulado;
END$$
DELIMITER ;

INSERT INTO cuentas (usu_correo, usu_contraseña, usu_tipo, usu_fecha_registro, usu_activo)
VALUES 
-- Consultores
('consultor1@demo.com', '123456', 'Consultor', NOW(), 1),
('consultor2@demo.com', '123456', 'Consultor', NOW(), 1),
-- Profesionales responsables de rutas
('austate@uniempresarial.edu.co', 'Austate123456', 'Profesional', NOW(), 1),
('contratofortalecimiento@uniemoresarial.edu.co', 'Contratofortalecimiento123456', 'Profesional', NOW(), 1),
('jsaenzc@uniempresarial.edu.co', 'Jsaenzc123456', 'Profesional', NOW(), 1),
('tprieto@uniempresarial.edu.co', 'Tprieto123456', 'Profesional', NOW(), 1),
-- Reclutadores
('reclutador@demo.com', '123456', 'Reclutador', NOW(), 1);

INSERT INTO areas_conocimiento (are_descripcion)
VALUES 
('Finanzas corporativas, Proyecciones financieras, construcción y analisis de indicadores financieros, valoración de empresas, inversión de riesgo. Atención e implementación de programas de intervención personal y familiar psicosocial'),
('Innovación, Metodologías Agiles, Manejo de herramientas IA'),
('Marketing, Modelo de negocio, Emprendimiento, Financiero,Legal, Portafolio de Productos, Estrategia de Marca, Portafolio de Productos,Pricing y Monetización'),
('Financiera'),
('Venta, Marketing, organizacional, comunicación'),
('Mercadeo y ventas, estrategia empresarial. financiero y financiamiento, producción y calidad, marketing digital, contratación laboral y seguridad social'),
('Cumplimmiento normativo y tributario, aplicación de tipos de  contratos laborales apropiados para el sector construcion, prevencion de riesgos laborales y estrategias de negociación con sindicatos o empleados'),
('Implementación de tecnicas avanzadas de costeo, analisis de rentabilidad, ventas y mercadeo en el sector turismo'),
('Gestión financiera, planificación financiera, presupuestación, analisis de margen de contribución, control financiero,y gestion de riesgo, metodologia de analisis de datos y uso de herramientas de modelado'),
('Enfocados en IA'),
('Mercadeo en Ventas enfocados en IA, analisis de datos y plataformas de automatización'),
('Gestión de cadena de suministro, sustema de gestión de inventarios, (ERP, WMS), automatización de procesos logisticos, soluciones de trazabilidad, anaisis de datos para optimización de rutas y logistica inversa'),
('Líneas de productividad operacional, productividad laboral, gestión de la calidad y gestión logística'),
('Estrategias para generar propuestas de valor diferenciadas, conevtar emocionalmente con el publico objetivo y fidelización de clientes'),
('Habilidaes de servicio al cliente, psicologia del cliente, empátia, técnicas de comunicación interpersonal, entrenamiento de ventas sugestivas'),
('Estrategias de mercadeo, plan de ventas y plan de mercadeo, marketing digital'),
('Apicación de la IA en las empresas, herramientas y tecnologias de la IA para potenciar el marketing y la comunicación digital, desarrollo de chatbot o asistente virtual para la meora de la experiencia al cliente , herramientas y recursos dispónibles para el desarrollo de la IA conversacional en la empresas, herramientas y plataformas disponibles para el analisis de datos y prediccion con IA'),
('Atracción y retención del talento humano y administración del talento humano'),
('Tributario y Financiero'),
('Moda e Industrias Creativas y Culturales, Seguridad Alimentaria, TIC, Turismo, Consultoría, Gestión del Talento Humano, Servicios Financieros, Cadenas de Abastecimiento, Salud, Sector Farmacéutico, Construcción y Energía, Servicios Financieros y Logística, Cosmética, y otros servicios empresariales'),
('Economía, administración de empresas, finanzas internacionales, comercio exterior, negocios internacionales, relaciones internacionales o afines'),
('Storytelling y herramientas para la mentoría-Creatividad e innovación-Comunicación y Liderazgo-Gestión del talento en la era de la  IA-:  Coaching de equipos directivos-Modelos de negocios disruptivos');


INSERT INTO modalidades (mod_nombre)
VALUES ('Virtual'), ('Presencial'), ('Híbrido');

INSERT INTO valor_horas (mod_id, val_hor_clasificacion, val_hor_precio)
VALUES 
(1, 'Internacionalización virtual', 90000),
(1, 'Internacionalización presencial', 95000),
(2, 'Innovación virtual', 90000),
(2, 'Innovación presencial', 95000),
(2, 'Presencial Bogotá y Soacha urbano', 85000),
(3, 'Otras', 80000);

INSERT INTO regiones (reg_id)
VALUES 
('REG01'),
('REG02'),
('REG03'),
('REG04');

INSERT INTO municipios (reg_id, mun_nombre)
VALUES
('REG01','Cajicá'),
('REG01','Chía'),
('REG01','Cogua'),
('REG01','Cota'),
('REG01','Gachancipá'),
('REG01','Granada'),
('REG01','La Calera'),
('REG01','Nemocón'),
('REG01','Sibaté'),
('REG01','Soacha rural'),
('REG01','Sopó'),
('REG01','Tabio'),
('REG01','Tenjo'),
('REG01','Tocancipá'),
('REG01','Zipaquirá'),
('REG02','Choachí'),
('REG02','Chocontá'),
('REG02','Gachetá'),
('REG02','Guasca'),
('REG02','Guatavita'),
('REG02','Machetá'),
('REG02','Manta'),
('REG02','Sesquilé'),
('REG02','Suesca'),
('REG02','Tibiritá'),
('REG02','Villa Pinzón'),
('REG03','Arbeláez'),
('REG03','Cabrera'),
('REG03','Cáqueza'),
('REG03','Chipaque'),
('REG03','Fómeque'),
('REG03','Fosca'),
('REG03','Fusagasugá'),
('REG03','Gachalá'),
('REG03','Gama'),
('REG03','Guayabetal'),
('REG03','Gutiérrez'),
('REG03','Junín'),
('REG03','Medina'),
('REG03','Pandi'),
('REG03','Pasca'),
('REG03','Quetame'),
('REG03','San Bernardo'),
('REG03','Silvania'),
('REG03','Tibacuy'),
('REG03','Ubalá'),
('REG03','Ubaque'),
('REG03','Une'),
('REG03','Venecia'),
('REG04','Carmen De Carupa'),
('REG04','Cucunubá'),
('REG04','Fúquene'),
('REG04','Guachetá'),
('REG04','Lenguazaque'),
('REG04','Simijaca'),
('REG04','Susa'),
('REG04','Sutatausa'),
('REG04','Tausa'),
('REG04','Ubaté');


INSERT INTO valor_horas_region (reg_id, val_reg_hora_base, val_reg_traslado, val_reg_sin_dictar, val_reg_dos_horas, val_reg_tres_horas, val_reg_cuatro_mas_horas)
VALUES 
('REG01', 90000, 30000, 30000, 105000, 100000, 97500),
('REG02', 95000, 60000, 60000, 125000, 115000, 110000),
('REG03', 100000, 85000, 85000, 142500, 128333, 121250),
('REG04', 105000, 110000, 110000, 160000, 141666, 132500);

INSERT INTO sectores (sec_cod, are_id, sec_nombre,sec_total_horas)
VALUES 
(1, 1,'Economia popular', 1310),
(2, 2,'Innovación', 460),
(3, 3,'Bogota Emprende  y Cundinamarca Emprende', 1600),
(4, 4,'Estrategia Financiera y Rendición de Cuentas para el Sector Moda e Industrias Creativas y Culturales', 818),
(5, 5,'Fortalecimiento de Equipos de Venta para el Sector Moda', 765),
(6, 6,'Programación abierta y region', 1142),
(7, 7,'Gestión del Talento Humano para el sector construcción', 240),
(8, 8,'Excelencia para el sector Turismo', 540),
(9, 9,'Proyectos financieros con proposito y Gestion financiera en empresas de servicios empresariales', 846),
(10, 10,'Transformación digital', 128),
(11, 11,'Tecnología en modelos de negocio y servicios de Consultoria', 510),
(12, 12,'Tecnología en Cadena de abastecimiento-(Logistica)', 854),
(13, 13,'Programa de Desarrollo proveedores', 1182),
(14, 14,'Marketing Experiencial', 1044),
(15, 15,'Servicio al Cliente para el sector gastronomico', 192),
(16, 16,'Mercadeo para Impulsar el Crecimiento', 192),
(17, 17,'Inteligencia Artificial', 336),
(18, 18,'Fidelización y atracción del Talento Humano', 336),
(19, 19,'Indicadores de gestión', 364),
(20, 19,'Metodologias de mejoramiento de la Productividad', 364),
(21, 19,'Gestión Finaciero', 364),
(22, 20,'Talleres', 272),
(23, 20,'Asesorias individales', 100),
(24, 21,'Internalización-Entregable-Preseleccion de mercado', 896),
(25, 21,'Internalización-Entregable-MarketFit', 896),
(26, 21,'Internalización-Entregable-One Pager', 0),
(27, 22,'Escuela de mentores', 60);

INSERT INTO actividades (act_tipo)
VALUES ('TALLERES, ASESORÍAS GRUPALES O CÁPSULAS'), ('ASESORÍAS INDIVIDUALES');

INSERT INTO rutas (val_hor_id, rut_nombre, rut_descripcion, rut_candidatos, rut_total_horas, rut_promedio_horas_candidato)
VALUES 
(6,'ECONOMIA POPULAR', 'Ruta para formación en economia popular', 10, 1310, 131),
(3,'INNOVACIÓN-VIRTUAL', 'Ruta para formación en innovación digital', 5, 460, 92),
(4,'INNOVACIÓN-PRESENCIAL', 'Ruta para formación en innovación digital', 5, 460, 92),
(6,'EMPRENDIMIENTO', 'Ruta para formación en emprendimiento', 10, 1600, 160),
(6,'ESTRATEGIA FINANCIERA Y RENDICIÓN DE CUENTAS PARA EL SECTOR MODA E INDUSTRIAS CREATIVAS Y CULTURALES', 'Ruta para formación en estrategia financiera y rendición de cuentas para el sector moda e industrias creativas y culturales', 818, 10, 81.8),
(6,'FORTALECIMIENTO DE EQUIPOS DE VENTA PARA EL SECTOR MODA', 'Ruta para formación en fortalecimiento de equipos de venta para el sector moda', 9, 765, 85),
(6,'PROGRAMACIÓN ABIERTA Y REGIÓN', 'Ruta para formación en programación abierta y región', 10, 1142, 114.2),
(6,'CICLOS FOCALIZADOS - MULTISECTORIAL', 'Ruta para formación en ciclos focalizados – multisectorial', 50, 4300, 86),
(6,'SECTOR ALIMENTOS', 'Ruta para formación en sector alimentos', 21, 1908, 90.8),
(6,'FINANCIERO Y PRODUCTIVIDAD', 'Ruta para formación en financiero y productividad', 6, 372, 62),
(1,'INTERNACIONALIZACIÓN-VIRTUAL-TALLERES', 'Ruta para formación en internacionalización', 6, 372, 62),
(2,'INTERNACIONALIZACIÓN-PRESENCIAL-TALLERES', 'Ruta para formación en internacionalización', 6, 372, 62),
(1,'INTERNACIONALIZACIÓN-VIRTUAL-ASESORIAS', 'Ruta para formación en internacionalización', 6, 372, 62),
(2,'INTERNACIONALIZACIÓN-PRESENCIAL-ASESOARIAS', 'Ruta para formación en internacionalización', 6, 372, 62),
(6,'PLAN DE INTERNALIZACIÓN', 'Ruta para formación en plan de internalización', 13, 896, 69),
(6,'ESCUELA DE MENTORES, VOLUNTARIADO Y PROGRAMACIÓN REGIÓN (FORO PRESIDENTES)', 'Ruta para formación en escuela de mentores, voluntariado y programación región (foro presidentes)', 4, 60, 15);

INSERT INTO ruta_sector (rut_id, sec_cod)
VALUES 
(1,1),
(2,2),
(3,2),
(4,3),
(5,4),
(6,5),
(7,6),
(8,7),
(8,8),
(8,9),
(8,10),
(8,11),
(8,12),
(8,13),
(9,14),
(9,15),
(9,16),
(9,17),
(9,18),
(10,19),
(10,20),
(10,21),
(11,22),
(12,22),
(13,23),
(14,23),
(15,24),
(15,25),
(15,26),
(16,27);

INSERT INTO programas (prog_nombre, prog_total_horas)
VALUES 
('Crecimiento Empresarial', 1310),
('Emprendimiento, Ruta Bogotá/Cundinamarca Emprende, Innovación', 2060),
('Consolidación y escalamiento empresarial', 10565),
('Foro presidentes', 60);

INSERT INTO programa_ruta (prog_id, rut_id)
VALUES 
(1,1),
(2,2),
(2,3),
(2,4),
(3,5),
(3,6),
(3,7),
(3,8),
(3,9),
(3,10),
(3,11),
(3,12),
(3,13),
(3,14),
(3,15),
(4,16);


INSERT INTO usuarios_info (usu_cedula, usu_id, are_id, usu_primer_nombre, usu_segundo_nombre, usu_primer_apellido, usu_segundo_apellido, usu_telefono, usu_direccion)
VALUES 
-- Consultores principales para testing
(1010219918, 1, 1, 'Camilo', 'Andrés', 'Garzón', 'Gutiérrez', '3001234567', 'Calle 72 #10-15, Bogotá'),
(1018425430, 2, 1, 'Adriana', 'Marcela', 'Díaz', 'Jaime', '3012345678', 'Carrera 15 #85-30, Bogotá'),

-- Todos los consultores de la lista
(1001234567, 1, 2, 'Daniel', 'Felipe', 'Rubio', 'Velandia', '3013456789', 'Calle 127 #45-20, Bogotá'),
(1002345678, 1, 3, 'Harvey', 'Arturo', 'Ramos', 'Velásquez', '3024567890', 'Carrera 7 #35-60, Bogotá'),
(1003456789, 1, 4, 'Hernán', 'Mauricio', 'Cortés', 'López', '3035678901', 'Avenida 68 #22-45, Bogotá'),
(1004567890, 1, 5, 'Jaime', 'Alberto', 'Burgos', 'González', '3046789012', 'Calle 100 #18-75, Bogotá'),
(1005678901, 1, 6, 'Johana', 'Carolina', 'Reyes', 'Rubiano', '3057890123', 'Carrera 13 #93-40, Bogotá'),
(1006789012, 1, 7, 'Jorge', 'Andrés', 'Rincón', 'Silva', '3068901234', 'Calle 57 #14-88, Bogotá'),
(1007890123, 1, 8, 'Jorge', 'Enrique', 'Bautista', 'Cusguén', '3079012345', 'Avenida Caracas #65-25, Bogotá'),
(1008901234, 1, 9, 'Julieth', 'Viviana', 'Tolosa', 'Cruz', '3080123456', 'Calle 80 #25-33, Bogotá'),
(1009012345, 1, 10, 'Lida', 'Marcela', 'Salazar', 'Osorio', '3091234567', 'Carrera 30 #48-70, Bogotá'),
(1010123456, 1, 11, 'Lizeth', 'Nathalia', 'Zamudio', 'Rojas', '3102345678', 'Calle 116 #9-85, Bogotá'),
(1011234567, 1, 12, 'Luis', 'Hernán', 'Gamba', 'Rodríguez', '3113456789', 'Avenida NQS #38-42, Bogotá'),
(1012345678, 1, 13, 'Luz', 'Andrea', 'Ramírez', 'Arias', '3124567890', 'Calle 63 #16-45, Bogotá'),
(1013456789, 1, 14, 'Marco', 'Antonio', 'Velandia', 'Ramos', '3135678901', 'Carrera 50 #72-18, Bogotá'),
(1014567890, 1, 15, 'Martha', 'Lucía', 'Chaparro', 'González', '3146789012', 'Calle 90 #20-55, Bogotá'),
(1015678901, 1, 16, 'Natalia', 'Andrea', 'Parra', 'Sánchez', '3157890123', 'Avenida Boyacá #86-30, Bogotá'),
(1016789012, 1, 17, 'Nubia', NULL, 'Peñuela', 'Urrea', '3168901234', 'Calle 45 #24-67, Bogotá'),
(1017890123, 1, 18, 'Olga', 'Lucía', 'Arcila', 'Real', '3179012345', 'Carrera 68 #40-92, Bogotá'),
(1018901234, 1, 19, 'Ricardo', NULL, 'Coronado', 'Otálora', '3180123456', 'Calle 134 #15-28, Bogotá'),
(1019012345, 1, 20, 'Saida', 'Liliana', 'León', 'Moreno', '3191234567', 'Avenida Suba #95-73, Bogotá'),
(1020123456, 1, 21, 'Tomás', 'Enrique', 'Martínez', 'Ortiz', '3202345678', 'Calle 26 #52-84, Bogotá'),
(1021234567, 1, 22, 'Wilmar', 'René', 'Reyes', 'García', '3213456789', 'Carrera 85 #67-19, Bogotá'),
(1022345678, 1, 1, 'Alex', 'Giovanny', 'Pinto', 'Morales', '3224567890', 'Calle 170 #32-46, Bogotá'),
(1023456789, 1, 2, 'Carlos', 'Enrique', 'Gómez', 'Umaña', '3235678901', 'Avenida El Dorado #78-25, Bogotá'),
(1024567890, 1, 3, 'Cielo', 'Carolina', 'Reyes', 'Cabrera', '3246789012', 'Calle 92 #21-58, Bogotá'),
(1025678901, 1, 4, 'Daniel', 'Fernando', 'Camacho', 'Camacho', '3257890123', 'Carrera 45 #89-37, Bogotá'),
(1026789012, 1, 5, 'Daniela', 'Catherine', 'Del Hierro', 'Patiño', '3268901234', 'Calle 140 #28-63, Bogotá'),
(1027890123, 1, 6, 'Diego', 'Mauricio', 'Marroquín', 'Carrasco', '3279012345', 'Avenida Primero de Mayo #75-42, Bogotá'),
(1028901234, 1, 7, 'Elkyn', 'Arnaldo', 'Rodríguez', 'Jiménez', '3280123456', 'Calle 53 #17-89, Bogotá'),
(1029012345, 1, 8, 'Gillyam', 'Germán', 'Martínez', 'Castro', '3291234567', 'Carrera 24 #96-14, Bogotá'),
(1030123456, 1, 9, 'Hernán', 'Antonio', 'Montoya', 'Uribe', '3302345678', 'Calle 106 #38-71, Bogotá'),
(1031234567, 1, 10, 'Jhon', 'Edinson', 'Lugo', 'Vega', '3313456789', 'Avenida Calle 80 #92-26, Bogotá'),
(1032345678, 1, 11, 'John', 'Alejandro', 'Buitrago', 'Ibarra', '3324567890', 'Calle 19 #44-85, Bogotá'),
(1033456789, 1, 12, 'Jonathan', NULL, 'López', 'Hurtado', '3335678901', 'Carrera 58 #73-39, Bogotá'),
(1034567890, 1, 13, 'Juan', 'Gabriel', 'Cuervo', 'Pinilla', '3346789012', 'Calle 147 #25-62, Bogotá'),
(1035678901, 1, 14, 'Vladimir', 'Andrés', 'Cabrejo', 'Félix', '3357890123', 'Avenida Las Américas #86-47, Bogotá'),
(1036789012, 1, 15, 'Juan', 'Camilo', 'Osorio', 'Gutiérrez', '3368901234', 'Calle 76 #31-78, Bogotá'),
(1037890123, 1, 16, 'Román', 'Enrique', 'Torres', 'Sierra', '3379012345', 'Carrera 72 #48-93, Bogotá'),
(1038901234, 1, 17, 'José', 'Arturo', 'Cortés', 'Ochoa', '3380123456', 'Calle 183 #15-34, Bogotá'),
(1039012345, 1, 18, 'Luis', 'Carlos', 'Sepúlveda', 'Martínez', '3391234567', 'Avenida Villavicencio #67-82, Bogotá'),
(1040123456, 1, 19, 'Diana', 'Cecilia', 'Albarracín', 'González', '3402345678', 'Calle 39 #23-56, Bogotá'),
(1041234567, 1, 20, 'Iván', 'Camilo', 'Gutiérrez', 'Carrasco', '3413456789', 'Carrera 104 #65-41, Bogotá'),
(1042345678, 1, 21, 'Juan', 'Alejandro', 'Gutiérrez', 'Hurtado', '3424567890', 'Calle 122 #42-87, Bogotá'),
(1043456789, 1, 22, 'Julio', 'César', 'Rayo', 'Peña', '3435678901', 'Avenida Ciudad de Cali #58-29, Bogotá'),
(1044567890, 1, 1, 'Angélica', 'María', 'Romero', 'Pinzón', '3446789012', 'Calle 87 #36-74, Bogotá'),
(1045678901, 1, 2, 'Bezna', 'Catalina', 'Díaz', 'Casañas', '3457890123', 'Carrera 19 #93-58, Bogotá'),
(1046789012, 1, 3, 'Cindy', 'Julliet', 'Piragauta', 'Niño', '3468901234', 'Calle 145 #27-83, Bogotá'),
(1047890123, 1, 4, 'Viviana', NULL, 'Galindo', 'Cardona', '3479012345', 'Avenida Carrera 30 #71-46, Bogotá'),
(1048901234, 1, 5, 'Magda', 'Johanna', 'Díaz', 'Ávila', '3480123456', 'Calle 94 #18-69, Bogotá'),
(1049012345, 1, 6, 'María', 'Victoria', 'Tinjacá', 'Sarabanda', '3491234567', 'Carrera 77 #52-91, Bogotá'),
(1050123456, 1, 7, 'Natalia', NULL, 'Varón', 'Betancourt', '3502345678', 'Calle 161 #34-17, Bogotá'),
(1051234567, 1, 8, 'Luis', 'Fernando', 'Muñoz', 'Berrio', '3513456789', 'Avenida Autopista Norte #85-53, Bogotá'),
(1052345678, 1, 9, 'María', 'Isabel', 'Rincón', 'Zambrano', '3524567890', 'Calle 47 #29-76, Bogotá'),
(1053456789, 1, 10, 'Sandra', 'Milena', 'Albarracín', 'Sánchez', '3535678901', 'Carrera 63 #74-22, Bogotá'),
(1054567890, 1, 11, 'José', 'Luis', 'Puentes', 'Niño', '3546789012', 'Calle 118 #41-65, Bogotá'),
(1055678901, 1, 12, 'Nicolás', NULL, 'Cardozo', 'Achury', '3557890123', 'Avenida Jiménez #56-38, Bogotá'),
(1056789012, 1, 13, 'Daniel', 'Andrés', 'Zárate', 'Giraldo', '3568901234', 'Calle 23 #87-51, Bogotá'),
(1057890123, 1, 14, 'Marlén', 'Liliana', 'Solís', 'López', '3579012345', 'Carrera 39 #61-84, Bogotá'),
(1058901234, 1, 15, 'Magda', 'Lucía', 'Menjura', 'Ramírez', '3580123456', 'Calle 79 #33-97, Bogotá'),
(1059012345, 1, 16, 'Julián', 'Esteban', 'Giraldo', 'Pinzón', '3591234567', 'Avenida Calle 26 #69-42, Bogotá'),
(1060123456, 1, 17, 'Alejandra', 'María', 'Moncada', 'Sánchez', '3602345678', 'Calle 132 #26-75, Bogotá'),
(1061234567, 1, 18, 'Daniel', 'Danilo', 'Delgado', 'Duque', '3613456789', 'Carrera 54 #88-18, Bogotá'),
(1062345678, 1, 19, 'Diego', 'Alejandro', 'Serna', 'Zapata', '3624567890', 'Calle 98 #37-63, Bogotá'),
(1063456789, 1, 20, 'Eric', 'Daniel', 'Moreno', 'Muñoz', '3635678901', 'Avenida Esperanza #72-29, Bogotá'),
(1064567890, 1, 21, 'Libia', 'Esperanza', 'Benavídez', 'Cáceres', '3646789012', 'Calle 155 #43-86, Bogotá'),
(1065678901, 1, 22, 'Fernando', NULL, 'Restrepo', 'Jaramillo', '3657890123', 'Carrera 81 #57-31, Bogotá'),
(1066789012, 1, 1, 'Óscar', 'David', 'Boada', 'López', '3668901234', 'Calle 112 #24-74, Bogotá'),
(1067890123, 1, 2, 'Samuel', NULL, 'Carrasco', 'Suárez', '3679012345', 'Avenida Chile #61-48, Bogotá'),
(1068901234, 1, 3, 'Carlos', 'Alberto', 'Pinzón', 'Medina', '3680123456', 'Calle 64 #39-92, Bogotá'),
(1069012345, 1, 4, 'Duver', NULL, 'Olarte', 'Ramírez', '3691234567', 'Carrera 47 #76-15, Bogotá'),
(1070123456, 1, 5, 'Claudia', 'Lorena', 'Gómez', 'Franco', '3702345678', 'Calle 129 #32-58, Bogotá'),
(1071234567, 1, 6, 'Luz', 'Carmen', 'Anaya', 'Saladén', '3713456789', 'Avenida Rojas #84-73, Bogotá'),
(1072345678, 1, 7, 'Myriam', 'Esperanza', 'Hurtado', 'Ariza', '3724567890', 'Calle 71 #28-46, Bogotá'),
(1073456789, 1, 8, 'Paola', 'Andrea', 'Jaramillo', 'Mejía', '3735678901', 'Carrera 92 #53-69, Bogotá'),
(1074567890, 1, 9, 'Eliana', 'Marcela', 'Gómez', 'Serrano', '3746789012', 'Calle 142 #41-82, Bogotá'),
(1075678901, 1, 10, 'Katherine', 'Andrea', 'Betancur', 'García', '3757890123', 'Avenida Pepe Sierra #67-35, Bogotá'),
(1076789012, 1, 11, 'Rafael', 'Alfonso', 'Toro', 'Guzmán', '3768901234', 'Calle 85 #19-78, Bogotá'),
(1077890123, 1, 12, 'Rodrigo', NULL, 'Echeverry', 'Trujillo', '3779012345', 'Carrera 35 #94-51, Bogotá'),
(1078901234, 1, 13, 'Zully', 'Mireya', 'Jiménez', 'Calvo', '3780123456', 'Calle 107 #46-24, Bogotá'),

-- Profesionales responsables de rutas
(2000000001, 3, 1, 'Andreína', NULL, 'Ustate', 'Rodríguez', '3052512922', 'Calle 45 #67-89, Bogotá'),
(2000000002, 4, 1, 'Alejandra', NULL, 'Buitrago', 'Rodríguez', '3042685388', 'Carrera 12 #34-56, Bogotá'),
(2000000003, 5, 2, 'Julie', NULL, 'Sáenz', 'Castañeda', '3118131235', 'Avenida 68 #78-90, Bogotá'),
(2000000004, 6, 3, 'Tatiana', NULL, 'Prieto', 'Rodríguez', '3012748031', 'Calle 100 #23-45, Bogotá'),

-- Reclutadores
(3000000001, 7, 4, 'Ana', 'María', 'González', 'Pérez', '3201234567', 'Carrera 50 #12-34, Bogotá');

-- Asignaciones para Andreína Ustate (cédula: 2000000001)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000001, 1010219918, 'Consultor especializado en transformación digital'),
(2000000001, 1018425430, 'Experta en consultoría empresarial'),
(2000000001, 1001234567, 'Especialista en desarrollo de negocios'),
(2000000001, 1002345678, 'Experto en finanzas corporativas'),
(2000000001, 1003456789, 'Consultor en gestión organizacional'),
(2000000001, 1004567890, 'Profesional en marketing digital'),
(2000000001, 1005678901, 'Especialista en innovación'),
(2000000001, 1006789012, 'Experto en logística'),
(2000000001, 1007890123, 'Consultor en transformación organizacional'),
(2000000001, 1008901234, 'Profesional en gestión de calidad');

-- Asignaciones para Alejandra Buitrago (cédula: 2000000002)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000002, 1009012345, 'Especialista en inteligencia de negocios'),
(2000000002, 1010123456, 'Experta en gestión financiera'),
(2000000002, 1011234567, 'Consultor en tecnología'),
(2000000002, 1012345678, 'Profesional en desarrollo sostenible'),
(2000000002, 1013456789, 'Especialista en comercio internacional'),
(2000000002, 1014567890, 'Experta en gestión del talento humano'),
(2000000002, 1015678901, 'Consultora en marketing estratégico'),
(2000000002, 1016789012, 'Profesional en educación corporativa'),
(2000000002, 1017890123, 'Especialista en gestión de proyectos'),
(2000000002, 1018901234, 'Experto en transformación digital');

-- Asignaciones para Julie Sáenz (cédula: 2000000003)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000003, 1022345678, 'Consultor en innovación digital'),
(2000000003, 1023456789, 'Especialista en gestión empresarial'),
(2000000003, 1024567890, 'Experta en desarrollo de negocios'),
(2000000003, 1025678901, 'Consultor en finanzas'),
(2000000003, 1026789012, 'Profesional en recursos humanos'),
(2000000003, 1027890123, 'Especialista en marketing'),
(2000000003, 1028901234, 'Experto en logística'),
(2000000003, 1029012345, 'Consultor en calidad'),
(2000000003, 1030123456, 'Profesional en análisis de datos'),
(2000000003, 1031234567, 'Especialista en tecnología');

-- Asignaciones para Tatiana Prieto (cédula: 2000000004)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000004, 1032345678, 'Consultor en desarrollo organizacional'),
(2000000004, 1033456789, 'Especialista en sistemas'),
(2000000004, 1034567890, 'Experto en gestión de proyectos'),
(2000000004, 1035678901, 'Profesional en marketing'),
(2000000004, 1036789012, 'Consultor en finanzas'),
(2000000004, 1037890123, 'Especialista en operaciones'),
(2000000004, 1038901234, 'Experto en calidad'),
(2000000004, 1039012345, 'Profesional en recursos humanos'),
(2000000004, 1040123456, 'Consultora en análisis financiero'),
(2000000004, 1041234567, 'Especialista en gestión empresarial');

-- Insertar hojas de vida DESPUÉS de usuarios_info para evitar errores de FK
INSERT INTO hojas_de_vida (
    usu_cedula, hv_archivo, hv_formato, hv_fecha_carga,
    hv_score_ia, hv_resumen_automatico, hv_verificado
) VALUES (
    1010219918, 'hv_camilo_garzon.pdf', 'PDF', NOW(), 87.5, 'Ingeniero con experiencia en transformación digital y asesoría a pymes.', 1),
    (1018425430, 'hv_adriana_diaz.pdf', 'PDF', NOW(), 91.2, 'Profesional con amplia experiencia en consultoría empresarial y gestión de proyectos.', 1),
    (1001234567, 'hv_daniel_rubio.pdf', 'PDF', NOW(), 86.8, 'Especialista en desarrollo de negocios y estrategias comerciales.', 1),
    (1002345678, 'hv_harvey_ramos.pdf', 'PDF', NOW(), 89.3, 'Experto en finanzas corporativas y análisis de inversiones.', 1),
    (1003456789, 'hv_hernan_cortes.pdf', 'PDF', NOW(), 85.7, 'Consultor en gestión organizacional y recursos humanos.', 1),
    (1004567890, 'hv_jaime_burgos.pdf', 'PDF', NOW(), 90.1, 'Profesional en marketing digital y estrategias de comunicación.', 1),
    (1005678901, 'hv_johana_reyes.pdf', 'PDF', NOW(), 88.6, 'Especialista en innovación y desarrollo de productos.', 1),
    (1006789012, 'hv_jorge_rincon.pdf', 'PDF', NOW(), 87.4, 'Experto en logística y cadena de suministro.', 1),
    (1007890123, 'hv_jorge_bautista.pdf', 'PDF', NOW(), 89.0, 'Consultor en transformación organizacional y liderazgo.', 1),
    (1008901234, 'hv_julieth_tolosa.pdf', 'PDF', NOW(), 86.2, 'Profesional en gestión de calidad y procesos.', 1),
    (1009012345, 'hv_lida_salazar.pdf', 'PDF', NOW(), 90.8, 'Especialista en inteligencia de negocios y análisis de datos.', 1),
    (1010123456, 'hv_lizeth_zamudio.pdf', 'PDF', NOW(), 88.1, 'Experta en gestión financiera y contabilidad estratégica.', 1),
    (1011234567, 'hv_luis_gamba.pdf', 'PDF', NOW(), 87.0, 'Consultor en tecnología y sistemas de información.', 1),
    (1012345678, 'hv_luz_ramirez.pdf', 'PDF', NOW(), 89.7, 'Profesional en desarrollo sostenible y responsabilidad social.', 1),
    (1013456789, 'hv_marco_velandia.pdf', 'PDF', NOW(), 86.5, 'Especialista en comercio internacional y negocios globales.', 1),
    (1014567890, 'hv_martha_chaparro.pdf', 'PDF', NOW(), 90.3, 'Experta en gestión del talento humano y desarrollo organizacional.', 1),
    (1015678901, 'hv_natalia_parra.pdf', 'PDF', NOW(), 88.4, 'Consultora en marketing estratégico y branding.', 1),
    (1016789012, 'hv_nubia_penuela.pdf', 'PDF', NOW(), 86.9, 'Profesional en educación corporativa y capacitación.', 1),
    (1017890123, 'hv_olga_arcila.pdf', 'PDF', NOW(), 89.2, 'Especialista en gestión de proyectos y metodologías ágiles.', 1),
    (1018901234, 'hv_ricardo_coronado.pdf', 'PDF', NOW(), 85.8, 'Experto en transformación digital y automatización de procesos.', 1);

-- Insertar vacantes DESPUÉS de usuarios_info para evitar errores de FK
INSERT INTO vacantes (
    usu_cedula, rut_id, vac_titulo, vac_descripcion,
    vac_renumeracion, vac_estado, vac_fecha_publicacion, vac_fecha_limite_postulacion
) VALUES (
    3000000001, 1, 'Asesor Innovación Digital',
    'Se requiere consultor para dictar talleres de innovación tecnológica a empresas.',
    1500000, 'Publicada', '2025-03-01', '2025-03-15'
);

-- Insertar relaciones usuario-ruta sin duplicación
INSERT INTO responsable_rutas (usu_id, rut_id, rr_rol)
VALUES 
(3, 1, 'Profesional'),  -- Andreína Ustate
(4, 1, 'Auxiliar'),     -- Alejandra Buitrago
(5, 2, 'Profesional'),  -- Julie Sáenz
(5, 3, 'Profesional'),  -- Julie Sáenz
(6, 4, 'Profesional'),  -- Tatiana Prieto
(6, 5, 'Profesional'),  -- Tatiana Prieto
(3, 6, 'Profesional'),  -- Andreína Ustate
(4, 6, 'Auxiliar');     -- Alejandra Buitrago

-- Insertar postulaciones DESPUÉS de usuarios_info, hojas_de_vida y vacantes
INSERT INTO postulaciones (
    usu_cedula, vac_id, hv_id, pos_fecha_postulacion,
    pos_estado, pos_puntuacion_match, pos_comentarios_reclutador
) VALUES (
    1010219918, 1, 1, NOW(), 'Preseleccionada', 88.2, 'El perfil se ajusta muy bien a la vacante'),
    (1018425430, 1, 2, NOW(), 'Aprobada', 91.5, 'Excelente experiencia y conocimientos'),
    (1001234567, 1, 3, NOW(), 'Aprobada', 87.3, 'Muy buen perfil técnico'),
    (1002345678, 1, 4, NOW(), 'Aprobada', 89.1, 'Gran experiencia en el área'),
    (1003456789, 1, 5, NOW(), 'Aprobada', 86.7, 'Sólido conocimiento del sector'),
    (1004567890, 1, 6, NOW(), 'Aprobada', 90.2, 'Perfil muy adecuado para la posición'),
    (1005678901, 1, 7, NOW(), 'Aprobada', 88.9, 'Excelentes referencias'),
    (1006789012, 1, 8, NOW(), 'Aprobada', 87.8, 'Muy buena presentación'),
    (1007890123, 1, 9, NOW(), 'Aprobada', 89.5, 'Amplia experiencia'),
    (1008901234, 1, 10, NOW(), 'Aprobada', 86.4, 'Buen ajuste al perfil'),
    (1009012345, 1, 11, NOW(), 'Aprobada', 91.0, 'Destacada trayectoria'),
    (1010123456, 1, 12, NOW(), 'Aprobada', 88.3, 'Muy competente'),
    (1011234567, 1, 13, NOW(), 'Aprobada', 87.6, 'Sólida experiencia'),
    (1012345678, 1, 14, NOW(), 'Aprobada', 89.8, 'Excelente candidato'),
    (1013456789, 1, 15, NOW(), 'Aprobada', 86.9, 'Muy buen perfil'),
    (1014567890, 1, 16, NOW(), 'Aprobada', 90.1, 'Destacada experiencia'),
    (1015678901, 1, 17, NOW(), 'Aprobada', 88.7, 'Gran potencial'),
    (1016789012, 1, 18, NOW(), 'Aprobada', 87.2, 'Muy competente'),
    (1017890123, 1, 19, NOW(), 'Aprobada', 89.3, 'Excelente preparación'),
    (1018901234, 1, 20, NOW(), 'Aprobada', 86.8, 'Buen ajuste al perfil');

-- Insertar contratos DESPUÉS de postulaciones
INSERT INTO contratos (oamp, pos_id, usu_cedula, oamp_consecutivo, oamp_terminos, oamp_fecha_generacion, oamp_estado, oamp_valor_total, oamp_documento_firmado)
VALUES 
(2001, 1, 1010219918, '001-2025-0023', 'Contrato para dictar talleres de tecnología', NOW(), 'Enviado', 150000000, 'contrato_001_2025_0023.pdf'),
(2002, 2, 1018425430, '001-2025-0004', 'Contrato para consultoría empresarial y gestión de proyectos', NOW(), 'Enviado', 145000000, 'contrato_001_2025_0004.pdf'),
(2003, 3, 1001234567, '001-2025-0051', 'Contrato para desarrollo de negocios y estrategias comerciales', NOW(), 'Enviado', 140000000, 'contrato_001_2025_0051.pdf'),
(2004, 4, 1002345678, '001-2025-0025', 'Contrato para finanzas corporativas y análisis de inversiones', NOW(), 'Enviado', 155000000, 'contrato_001_2025_0025.pdf'),
(2005, 5, 1003456789, '001-2025-0056', 'Contrato para gestión organizacional y recursos humanos', NOW(), 'Enviado', 142000000, 'contrato_001_2025_0056.pdf'),
(2006, 6, 1004567890, '001-2025-0035', 'Contrato para marketing digital y estrategias de comunicación', NOW(), 'Enviado', 148000000, 'contrato_001_2025_0035.pdf'),
(2007, 7, 1005678901, '001-2025-0047', 'Contrato para innovación y desarrollo de productos', NOW(), 'Enviado', 147000000, 'contrato_001_2025_0047.pdf'),
(2008, 8, 1006789012, '001-2025-0031', 'Contrato para logística y cadena de suministro', NOW(), 'Enviado', 143000000, 'contrato_001_2025_0031.pdf'),
(2009, 9, 1007890123, '001-2025-0010', 'Contrato para transformación organizacional y liderazgo', NOW(), 'Enviado', 151000000, 'contrato_001_2025_0010.pdf'),
(2010, 10, 1008901234, '001-2025-0044', 'Contrato para gestión de calidad y procesos', NOW(), 'Enviado', 139000000, 'contrato_001_2025_0044.pdf'),
(2011, 11, 1009012345, '001-2025-0037', 'Contrato para inteligencia de negocios y análisis de datos', NOW(), 'Enviado', 156000000, 'contrato_001_2025_0037.pdf'),
(2012, 12, 1010123456, '001-2025-0015', 'Contrato para gestión financiera y contabilidad estratégica', NOW(), 'Enviado', 144000000, 'contrato_001_2025_0015.pdf'),
(2013, 13, 1011234567, '001-2025-0042', 'Contrato para tecnología y sistemas de información', NOW(), 'Enviado', 149000000, 'contrato_001_2025_0042.pdf'),
(2014, 14, 1012345678, '001-2025-0036', 'Contrato para desarrollo sostenible y responsabilidad social', NOW(), 'Enviado', 141000000, 'contrato_001_2025_0036.pdf'),
(2015, 15, 1013456789, '001-2025-0008', 'Contrato para comercio internacional y negocios globales', NOW(), 'Enviado', 153000000, 'contrato_001_2025_0008.pdf'),
(2016, 16, 1014567890, '001-2025-0033', 'Contrato para gestión del talento humano y desarrollo organizacional', NOW(), 'Enviado', 146000000, 'contrato_001_2025_0033.pdf'),
(2017, 17, 1015678901, '001-2025-0053', 'Contrato para marketing estratégico y branding', NOW(), 'Enviado', 150000000, 'contrato_001_2025_0053.pdf'),
(2018, 18, 1016789012, '001-2025-0013', 'Contrato para educación corporativa y capacitación', NOW(), 'Enviado', 138000000, 'contrato_001_2025_0013.pdf'),
(2019, 19, 1017890123, '001-2025-0054', 'Contrato para gestión de proyectos y metodologías ágiles', NOW(), 'Enviado', 152000000, 'contrato_001_2025_0054.pdf'),
(2020, 20, 1018901234, '001-2025-0022', 'Contrato para transformación digital y automatización de procesos', NOW(), 'Enviado', 154000000, 'contrato_001_2025_0022.pdf');

-- Programaciones grupales para diferentes consultores (DESPUÉS de contratos)
INSERT INTO programaciones_grupales (
    usu_cedula, pr_id, val_reg_id, oamp, act_id, mod_id, pro_codigo_agenda,
    pro_tematica, pro_mes, pro_fecha_formacion, pro_hora_inicio, pro_hora_fin,
    pro_horas_dictar, pro_coordinador_ccb, pro_direccion, pro_enlace, pro_estado,
    pro_numero_hora_pagar, pro_numero_hora_cobrar, pro_valor_hora,
    pro_valor_total_hora_pagar, pro_valor_total_hora_ccb,
    pro_entregables, pro_dependencia, pro_observaciones
) VALUES (
    1018425430, 2, 3, 2002, 1, 1, 1111, 'Planeación Financiera', 'Enero', '2025-01-10',
    '09:00:00', '12:00:00', 3, 'Andrea Cortés', 'Calle 45 #7-30', 'https://link.com', 'Realizada',
    3, 3, 142500, 427500, 427500, 'Plan financiero entregado', 'Uniempresarial', 'Con alta participación'),
    
(1001234567, 3, NULL, 2003, 1, 2, 2222, 'Taller Innovación', 'Febrero', '2025-02-14',
    '08:00:00', '10:00:00', 2, 'Juan Pérez', 'Carrera 30 #8-20', 'https://meet.com', 'Realizada',
    2, 2, 90000, 180000, 180000, 'Informe entregado', 'CCB', 'Bien ejecutado'),
    
(1002345678, 5, 4, 2004, 2, 2, 3333, 'Liderazgo y Gestión', 'Marzo', '2025-03-05',
    '10:00:00', '13:00:00', 3, 'Sara Gómez', 'Calle 12 #5-15', 'https://zoom.com', 'Realizada',
    3, 3, 160000, 480000, 480000, 'Lista de asistencia y memorias', 'Uniempresarial', 'Excelente desarrollo'),
    
(1003456789, 4, 2, 2005, 1, 1, 4444, 'Gestión del Talento Humano', 'Abril', '2025-04-08',
    '14:00:00', '17:00:00', 3, 'Carlos Mendoza', 'Av. El Dorado #45-67', 'https://teams.com', 'Realizada',
    3, 3, 125000, 375000, 375000, 'Manual de procesos entregado', 'CCB', 'Excelente participación'),
    
(1004567890, 6, 1, 2006, 2, 3, 5555, 'Marketing Digital Avanzado', 'Mayo', '2025-05-12',
    '09:00:00', '12:00:00', 3, 'Laura Vásquez', 'Cra 15 #72-89', 'https://meet.google.com', 'Realizada',
    3, 3, 105000, 315000, 315000, 'Estrategia digital documentada', 'Uniempresarial', 'Muy buena recepción');

-- Programaciones individuales para diferentes consultores
INSERT INTO programaciones_individuales (
    usu_cedula, pr_id, val_reg_id, oamp, act_id, mod_id, proin_codigo_agenda,
    proin_tematica, proin_mes, proin_fecha_formacion, proin_hora_inicio, proin_hora_fin,
    proin_horas_dictar, proin_coordinador_ccb, proin_direccion, proin_enlace,
    proin_nombre_empresario, proin_identificacion_empresario, proin_estado, proin_numero_hora_pagar, proin_numero_hora_cobrar,
    proin_valor_hora, proin_valor_total_hora_pagar, proin_valor_total_hora_ccb,
    proin_entregables, proin_dependencia, proin_observaciones
) VALUES (
    1005678901, 2, 2, 2007, 2, 2, 6666, 'Asesoría en Innovación', 'Febrero', '2025-02-05',
    '09:00:00', '12:00:00', 3, 'Carlos Díaz', 'Calle 34 #8-90', 'https://meet.google.com/leg123',
    'Carlos Duarte', '12155844', 'Realizada', 3, 3, 125000, 375000, 375000,
    'Documento asesoría', 'CCB', 'Sesión completada sin novedades'),
    
(1006789012, 3, NULL, 2008, 2, 2, 7777, 'Asesoría en Logística', 'Marzo', '2025-03-15',
    '10:00:00', '12:00:00', 2, 'Lucía Herrera', 'Cra 45 #20-12', 'https://zoom.us/ia123',
    'Tatiana García', '548158484', 'Realizada', 2, 2, 90000, 180000, 180000,
    'Informe logístico aplicado', 'Uniempresarial', 'Buena interacción con la empresa'),
    
(1007890123, 4, 4, 2009, 2, 2, 8888, 'Mentoría en Liderazgo', 'Abril', '2025-04-20',
    '14:00:00', '17:00:00', 3, 'Paula Gómez', 'Av. Caracas #20-30', 'https://teams.com/brandmentor',
    'Ana López', '58784864', 'Realizada', 3, 3, 160000, 480000, 480000,
    'Plan de liderazgo entregado', 'CCB', 'Excelente participación y resultados'),
    
(1008901234, 5, 3, 2010, 2, 1, 9999, 'Asesoría en Gestión de Calidad', 'Mayo', '2025-05-10',
    '08:00:00', '11:00:00', 3, 'Roberto Silva', 'Calle 85 #42-18', 'https://meet.google.com/quality',
    'María Fernández', '45789123', 'Realizada', 3, 3, 142500, 427500, 427500,
    'Manual de calidad entregado', 'Uniempresarial', 'Muy satisfactorio'),
    
(1009012345, 6, 1, 2011, 2, 3, 1010, 'Consultoría en Inteligencia de Negocios', 'Junio', '2025-06-15',
    '13:00:00', '16:00:00', 3, 'Diana Torres', 'Av. 68 #125-30', 'https://teams.com/bi',
    'Pedro Martínez', '78945612', 'Realizada', 3, 3, 105000, 315000, 315000,
    'Dashboard BI implementado', 'CCB', 'Resultados excepcionales');

-- Evidencia grupal 1
INSERT INTO evidencias_grupales (
    usu_cedula, pro_id, rr_id, evi_mes, evi_fecha, evi_hora_inicio, evi_hora_fin,
    evi_horas_dictar, evi_valor_hora, evi_valor_total_horas,
    evi_tematica_dictada, evi_numero_asistentes, evi_direccion, evi_estado, evi_evidencias
) VALUES (
    1010219918, 1, 1, 'Enero', '2025-01-20 09:00:00', '2025-01-20 09:00:00', '2025-01-20 12:00:00',
    3, 85000, 255000,
    'Transformación digital en PYMES', 20, 'Calle 100 #45-32', 'Realizada', 'evidencia_grupal_1.pdf'
);

-- Evidencia grupal 2
INSERT INTO evidencias_grupales (
    usu_cedula, pro_id, rr_id, evi_mes, evi_fecha, evi_hora_inicio, evi_hora_fin,
    evi_horas_dictar, evi_valor_hora, evi_valor_total_horas,
    evi_tematica_dictada, evi_numero_asistentes, evi_direccion, evi_estado, evi_evidencias
) VALUES (
    1001234567, 2, 2, 'Febrero', '2025-02-14 14:00:00', '2025-02-14 14:00:00', '2025-02-14 17:00:00',
    3, 90000, 270000,
    'Introducción a la Inteligencia Artificial', 25, 'Cra 15 #72-10', 'Realizada', 'evidencia_grupal_2.pdf'
);
-- Evidencia grupal 3
INSERT INTO evidencias_grupales (
    usu_cedula, pro_id, rr_id, evi_mes, evi_fecha, evi_hora_inicio, evi_hora_fin,
    evi_horas_dictar, evi_valor_hora, evi_valor_total_horas,
    evi_tematica_dictada, evi_numero_asistentes, evi_direccion, evi_estado, evi_evidencias
) VALUES (
    1002345678, 3, 3, 'Marzo', '2025-03-05 08:30:00', '2025-03-05 08:30:00', '2025-03-05 11:30:00',
    3, 95000, 285000,
    'Gestión de Proyectos Ágiles', 18, 'Av. Suba #90-45', 'Realizada', 'evidencia_grupal_3.pdf'
);

-- Evidencia para proin_id = 1
INSERT INTO evidencias_individuales (
    usu_cedula, proin_id, rr_id, eviin_mes, eviin_fecha, eviin_hora_inicio, eviin_hora_fin,
    eviin_horas_dictar, eviin_valor_hora, eviin_valor_total_horas, eviin_tematica_dictada,
    eviin_numero_asistentes, eviin_direccion, eviin_estado, eviin_razon_social,
    eviin_nombre_asesorado, eviin_identificacion_asesorado, eviin_evidencias, evi_pantallazo_avanza
) VALUES (
    1003456789, 1, 1, 'Febrero', '2025-02-05 09:00:00', '2025-02-05 09:00:00', '2025-02-05 12:00:00',
    3, 125000, 375000, 'Asesoría Legal',
    1, 'Calle 34 #8-90', 'Realizada', 900123, 'Carlos Duarte', 103456789,
    'evidencia1.pdf', 'pantallazo1.png'
);

-- Evidencia para proin_id = 2
INSERT INTO evidencias_individuales (
    usu_cedula, proin_id, rr_id, eviin_mes, eviin_fecha, eviin_hora_inicio, eviin_hora_fin,
    eviin_horas_dictar, eviin_valor_hora, eviin_valor_total_horas, eviin_tematica_dictada,
    eviin_numero_asistentes, eviin_direccion, eviin_estado, eviin_razon_social,
    eviin_nombre_asesorado, eviin_identificacion_asesorado, eviin_evidencias, evi_pantallazo_avanza
) VALUES (
    1004567890, 2, 2, 'Marzo', '2025-03-15 10:00:00', '2025-03-15 10:00:00', '2025-03-15 12:00:00',
    2, 90000, 180000, 'Asesoría IA',
    1, 'Cra 45 #20-12', 'Realizada', 901234, 'Tatiana García', 104567890,
    'evidencia2.pdf', 'pantallazo2.png'
);

-- Evidencia para proin_id = 3
INSERT INTO evidencias_individuales (
    usu_cedula, proin_id, rr_id, eviin_mes, eviin_fecha, eviin_hora_inicio, eviin_hora_fin,
    eviin_horas_dictar, eviin_valor_hora, eviin_valor_total_horas, eviin_tematica_dictada,
    eviin_numero_asistentes, eviin_direccion, eviin_estado, eviin_razon_social,
    eviin_nombre_asesorado, eviin_identificacion_asesorado, eviin_evidencias, evi_pantallazo_avanza
) VALUES (
    1005678901, 3, 3, 'Abril', '2025-04-20 14:00:00', '2025-04-20 14:00:00', '2025-04-20 17:00:00',
    3, 160000, 480000, 'Mentoría en Branding',
    1, 'Av. Caracas #20-30', 'Realizada', 902345, 'Ana López', 105678901,
    'evidencia3.pdf', 'pantallazo3.png'
);

INSERT INTO cronograma_informes_ccb (
    mes_ejecucion,
    fecha_maxima_envio_ccb,
    fecha_maxima_revision_ccb,
    fecha_maxima_subsanacion,
    fecha_maxima_aprobacion_final,
    fecha_maxima_facturacion,
    descripcion
) VALUES 
-- ABRIL 2025
('abril', '2025-05-08', '2025-05-13', '2025-05-15', '2025-05-19', '2025-05-23',
'Cronograma abril - primer mes de ejecución'),

-- MAYO 2025
('mayo', '2025-06-09', '2025-06-12', '2025-06-16', '2025-06-17', '2025-06-19',
'Cronograma mayo - segundo mes de ejecución'),

-- JUNIO 2025
('junio', '2025-07-02', '2025-07-10', '2025-07-14', '2025-07-16', '2025-07-22',
'Cronograma junio - tercer mes de ejecución'),

-- JULIO 2025
('julio', '2025-07-20', '2025-07-21', '2025-07-22', '2025-07-23', '2025-07-24',
'Cronograma julio - cuarto mes de ejecución'),

-- AGOSTO 2025
('agosto', '2025-09-05', '2025-09-10', '2025-09-12', '2025-09-16', '2025-09-23',
'Cronograma agosto - quinto mes de ejecución'),

-- SEPTIEMBRE 2025
('septiembre', '2025-10-07', '2025-10-10', '2025-10-15', '2025-10-17', '2025-10-24',
'Cronograma septiembre - sexto mes de ejecución'),

-- OCTUBRE 2025
('octubre', '2025-11-10', '2025-11-13', '2025-11-18', '2025-11-19', '2025-11-21',
'Cronograma octubre - séptimo mes de ejecución'),

-- NOVIEMBRE 2025 - NOTA: fecha_maxima_facturacion es NULL (por confirmar)
('noviembre', '2025-12-05', '2025-12-11', '2025-12-12', '2025-12-16', '2025-12-20',
'Cronograma noviembre - octavo mes de ejecución - facturación por confirmar');

-- 3. Reinsertar plantillas de notificación corregidas
INSERT INTO notificaciones_cronograma (cronograma_id, tipo_fecha, dias_anticipacion, mensaje_plantilla)
SELECT 
    c.cronograma_id,
    'envio_ccb' as tipo_fecha,
    3 as dias_anticipacion,
    CONCAT('⏰ RECORDATORIO: Fecha límite para envío de informes de ', c.mes_ejecucion, ' a CCB: ', DATE_FORMAT(c.fecha_maxima_envio_ccb, '%d/%m/%Y'), '. Faltan 3 días.') as mensaje_plantilla
FROM cronograma_informes_ccb c;

INSERT INTO notificaciones_cronograma (cronograma_id, tipo_fecha, dias_anticipacion, mensaje_plantilla)
SELECT 
    c.cronograma_id,
    'subsanacion' as tipo_fecha,
    2 as dias_anticipacion,
    CONCAT('🚨 URGENTE: Fecha límite para subsanaciones de ', c.mes_ejecucion, ': ', DATE_FORMAT(c.fecha_maxima_subsanacion, '%d/%m/%Y'), '. Faltan 2 días.') as mensaje_plantilla
FROM cronograma_informes_ccb c;

-- Solo crear notificaciones de facturación para fechas que NO son NULL
INSERT INTO notificaciones_cronograma (cronograma_id, tipo_fecha, dias_anticipacion, mensaje_plantilla)
SELECT 
    c.cronograma_id,
    'facturacion' as tipo_fecha,
    1 as dias_anticipacion,
    CONCAT('💰 RECORDATORIO: Fecha límite para facturación de ', c.mes_ejecucion, ': ', DATE_FORMAT(c.fecha_maxima_facturacion, '%d/%m/%Y'), '. Mañana vence el plazo.') as mensaje_plantilla
FROM cronograma_informes_ccb c
WHERE c.fecha_maxima_facturacion IS NOT NULL;

-- 4. Verificar resultados
SELECT 'DATOS INSERTADOS CORRECTAMENTE' as resultado;

SELECT 
    mes_ejecucion,
    fecha_maxima_envio_ccb,
    fecha_maxima_facturacion,
    CASE 
        WHEN fecha_maxima_facturacion IS NULL THEN 'POR CONFIRMAR'
        ELSE 'FECHA DEFINIDA'
    END as estado_facturacion
FROM cronograma_informes_ccb
ORDER BY fecha_maxima_envio_ccb; 

-- ====================================================================
-- VISTAS DE COMPATIBILIDAD Y CONSULTAS OPTIMIZADAS
-- ====================================================================

-- Vista para mantener compatibilidad con código existente
CREATE VIEW vista_responsable_rutas AS
SELECT 
    rr.rr_id as res_id,
    rr.usu_id,
    rr.rut_id,
    CONCAT(ui.usu_primer_nombre, ' ', 
           COALESCE(ui.usu_segundo_nombre, ''), ' ',
           ui.usu_primer_apellido, ' ', 
           ui.usu_segundo_apellido) as res_nombre,
    rr.rr_rol as res_rol,
    c.usu_correo as res_correo,
    ui.usu_telefono as res_telefono,
    r.rut_nombre,
    rr.rr_activo,
    rr.rr_fecha_asignacion
FROM responsable_rutas rr
JOIN cuentas c ON rr.usu_id = c.usu_id
JOIN usuarios_info ui ON c.usu_id = ui.usu_id
JOIN rutas r ON rr.rut_id = r.rut_id
WHERE rr.rr_activo = TRUE;

-- Vista resumen de responsables y rutas
CREATE VIEW resumen_responsables_rutas AS
SELECT 
    ui.usu_cedula,
    CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as nombre_responsable,
    c.usu_correo,
    ui.usu_telefono,
    COUNT(rr.rut_id) as total_rutas_asignadas,
    GROUP_CONCAT(r.rut_nombre ORDER BY r.rut_nombre SEPARATOR ', ') as rutas_asignadas,
    GROUP_CONCAT(CONCAT(r.rut_nombre, ' (', rr.rr_rol, ')') ORDER BY r.rut_nombre SEPARATOR ', ') as rutas_con_rol
FROM responsable_rutas rr
JOIN cuentas c ON rr.usu_id = c.usu_id
JOIN usuarios_info ui ON c.usu_id = ui.usu_id
JOIN rutas r ON rr.rut_id = r.rut_id
WHERE rr.rr_activo = TRUE
GROUP BY ui.usu_cedula, ui.usu_primer_nombre, ui.usu_primer_apellido, c.usu_correo, ui.usu_telefono;

-- Vista resumen de rutas y responsables
CREATE VIEW resumen_rutas_responsables AS
SELECT 
    r.rut_id,
    r.rut_nombre,
    r.rut_descripcion,
    COUNT(rr.usu_id) as total_responsables,
    COUNT(CASE WHEN rr.rr_rol = 'Profesional' THEN 1 END) as total_profesionales,
    COUNT(CASE WHEN rr.rr_rol = 'Auxiliar' THEN 1 END) as total_auxiliares,
    GROUP_CONCAT(
        CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido, ' (', rr.rr_rol, ')')
        ORDER BY rr.rr_rol, ui.usu_primer_nombre SEPARATOR ', '
    ) as responsables_asignados
FROM rutas r
LEFT JOIN responsable_rutas rr ON r.rut_id = rr.rut_id AND rr.rr_activo = TRUE
LEFT JOIN cuentas c ON rr.usu_id = c.usu_id
LEFT JOIN usuarios_info ui ON c.usu_id = ui.usu_id
GROUP BY r.rut_id, r.rut_nombre, r.rut_descripcion;

-- Vista para obtener consultores asignados a una gestora
CREATE VIEW vista_gestora_consultores AS
SELECT 
    gc.gc_id,
    gc.gestora_cedula,
    gc.consultor_cedula,
    -- Información de la gestora
    CONCAT(g.usu_primer_nombre, ' ', 
           COALESCE(g.usu_segundo_nombre, ''), ' ',
           g.usu_primer_apellido, ' ', 
           g.usu_segundo_apellido) as gestora_nombre,
    cg.usu_correo as gestora_correo,
    g.usu_telefono as gestora_telefono,
    -- Información del consultor
    CONCAT(c.usu_primer_nombre, ' ', 
           COALESCE(c.usu_segundo_nombre, ''), ' ',
           c.usu_primer_apellido, ' ', 
           c.usu_segundo_apellido) as consultor_nombre,
    cc.usu_correo as consultor_correo,
    c.usu_telefono as consultor_telefono,
    ac.are_descripcion as consultor_area_conocimiento,
    -- Información de la asignación
    gc.gc_fecha_asignacion,
    gc.gc_activo,
    gc.gc_observaciones
FROM gestora_consultores gc
JOIN usuarios_info g ON gc.gestora_cedula = g.usu_cedula
JOIN cuentas cg ON g.usu_id = cg.usu_id
JOIN usuarios_info c ON gc.consultor_cedula = c.usu_cedula
JOIN cuentas cc ON c.usu_id = cc.usu_id
JOIN areas_conocimiento ac ON c.are_id = ac.are_id
WHERE gc.gc_activo = TRUE
  AND cg.usu_tipo IN ('Profesional', 'Administrador')
  AND cc.usu_tipo = 'Consultor'
  AND cg.usu_activo = TRUE
  AND cc.usu_activo = TRUE;

-- Vista para resumen de asignaciones por gestora
CREATE VIEW resumen_asignaciones_gestora AS
SELECT 
    gc.gestora_cedula,
    CONCAT(g.usu_primer_nombre, ' ', g.usu_primer_apellido) as gestora_nombre,
    cg.usu_correo as gestora_correo,
    COUNT(gc.consultor_cedula) as total_consultores_asignados,
    GROUP_CONCAT(
        CONCAT(c.usu_primer_nombre, ' ', c.usu_primer_apellido)
        ORDER BY c.usu_primer_nombre SEPARATOR ', '
    ) as consultores_asignados
FROM gestora_consultores gc
JOIN usuarios_info g ON gc.gestora_cedula = g.usu_cedula
JOIN cuentas cg ON g.usu_id = cg.usu_id
JOIN usuarios_info c ON gc.consultor_cedula = c.usu_cedula
JOIN cuentas cc ON c.usu_id = cc.usu_id
WHERE gc.gc_activo = TRUE
  AND cg.usu_tipo IN ('Profesional', 'Administrador')
  AND cc.usu_tipo = 'Consultor'
  AND cg.usu_activo = TRUE
  AND cc.usu_activo = TRUE
GROUP BY gc.gestora_cedula, g.usu_primer_nombre, g.usu_primer_apellido, cg.usu_correo;

-- ====================================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ====================================================================

-- Procedimiento para asignar un consultor a una gestora
DELIMITER $$
CREATE PROCEDURE AsignarConsultor(
    IN p_gestora_cedula BIGINT,
    IN p_consultor_cedula BIGINT,
    IN p_observaciones TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar que la gestora existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM usuarios_info ui
        JOIN cuentas c ON ui.usu_id = c.usu_id
        WHERE ui.usu_cedula = p_gestora_cedula 
        AND c.usu_tipo IN ('Profesional', 'Administrador')
        AND c.usu_activo = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La gestora no existe o no es válida';
    END IF;
    
    -- Verificar que el consultor existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM usuarios_info ui
        JOIN cuentas c ON ui.usu_id = c.usu_id
        WHERE ui.usu_cedula = p_consultor_cedula 
        AND c.usu_tipo = 'Consultor'
        AND c.usu_activo = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El consultor no existe o no es válido';
    END IF;
    
    -- Insertar o actualizar la asignación
    INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
    VALUES (p_gestora_cedula, p_consultor_cedula, p_observaciones)
    ON DUPLICATE KEY UPDATE
        gc_activo = TRUE,
        gc_observaciones = p_observaciones,
        gc_fecha_asignacion = CURRENT_TIMESTAMP;
    
    COMMIT;
END$$
DELIMITER ;

-- Procedimiento para desasignar un consultor de una gestora
DELIMITER $$
CREATE PROCEDURE DesasignarConsultor(
    IN p_gestora_cedula BIGINT,
    IN p_consultor_cedula BIGINT
)
BEGIN
    UPDATE gestora_consultores 
    SET gc_activo = FALSE
    WHERE gestora_cedula = p_gestora_cedula 
      AND consultor_cedula = p_consultor_cedula;
END$$
DELIMITER ;

CREATE OR REPLACE VIEW v_proximas_fechas_limite AS
SELECT 
    c.mes_ejecucion,
    c.fecha_maxima_envio_ccb,
    DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) as dias_hasta_envio,
    c.fecha_maxima_subsanacion,
    DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) as dias_hasta_subsanacion,
    c.fecha_maxima_facturacion,
    CASE 
        WHEN c.fecha_maxima_facturacion IS NULL THEN NULL
        ELSE DATEDIFF(c.fecha_maxima_facturacion, CURDATE())
    END as dias_hasta_facturacion,
    c.descripcion
FROM cronograma_informes_ccb c
WHERE c.activo = TRUE
ORDER BY c.fecha_maxima_envio_ccb ASC;

-- =====================================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================================

-- Verificar datos insertados
SELECT 'Cronograma insertado correctamente' as verificacion, COUNT(*) as total_meses
FROM cronograma_informes_ccb;

-- Ver próximas fechas límite
SELECT * FROM v_proximas_fechas_limite
WHERE dias_hasta_envio >= 0
LIMIT 3; 

