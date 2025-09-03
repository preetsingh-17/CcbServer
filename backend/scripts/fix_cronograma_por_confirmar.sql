-- =====================================================================
-- SCRIPT DE CORRECCIÓN: Cambiar 'por confirmar' por NULL
-- =====================================================================

-- 1. Eliminar datos existentes si ya se insertaron con error
DELETE FROM notificaciones_cronograma;
DELETE FROM cronograma_informes_ccb;

-- 2. Reinsertar datos correctos
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

-- NOVIEMBRE 2025 - NOTA: fecha_maxima_facturacion es NULL (por confirmar)
('noviembre', '2025-12-05', '2025-12-11', '2025-12-12', '2025-12-16', NULL,
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