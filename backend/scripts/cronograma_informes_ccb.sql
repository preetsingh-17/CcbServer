-- =====================================================================
-- TABLA PARA CRONOGRAMA DE FECHAS LÍMITE DE INFORMES CCB
-- Basado en el CONTRATO DE PRESTACIÓN DE SERVICIOS No. 6200017455/2025
-- =====================================================================

-- Tabla para almacenar el cronograma de fechas límite de entrega de informes
CREATE TABLE IF NOT EXISTS cronograma_informes_ccb (
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

-- =====================================================================
-- DATOS DEL CRONOGRAMA SEGÚN EL CONTRATO CCB
-- =====================================================================

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
('julio', '2025-08-06', '2025-08-13', '2025-08-15', '2025-08-20', '2025-08-22',
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

-- NOVIEMBRE 2025
('noviembre', '2025-12-05', '2025-12-11', '2025-12-12', '2025-12-16', NULL,
'Cronograma noviembre - octavo mes de ejecución - facturación por confirmar');

-- =====================================================================
-- TABLA PARA NOTIFICACIONES AUTOMÁTICAS DE FECHAS LÍMITE
-- =====================================================================

-- Tabla para gestionar las notificaciones automáticas sobre fechas límite
CREATE TABLE IF NOT EXISTS notificaciones_cronograma (
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

-- =====================================================================
-- PLANTILLAS DE NOTIFICACIONES POR DEFECTO
-- =====================================================================

-- Insertar plantillas de notificación para cada tipo de fecha
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

INSERT INTO notificaciones_cronograma (cronograma_id, tipo_fecha, dias_anticipacion, mensaje_plantilla)
SELECT 
    c.cronograma_id,
    'facturacion' as tipo_fecha,
    1 as dias_anticipacion,
    CONCAT('💰 RECORDATORIO: Fecha límite para facturación de ', c.mes_ejecucion, ': ', 
           CASE 
               WHEN c.fecha_maxima_facturacion IS NULL THEN 'POR CONFIRMAR'
               ELSE DATE_FORMAT(c.fecha_maxima_facturacion, '%d/%m/%Y')
           END, 
           '. Mañana vence el plazo.') as mensaje_plantilla
FROM cronograma_informes_ccb c;

-- =====================================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================================

-- Vista para obtener próximas fechas límite
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