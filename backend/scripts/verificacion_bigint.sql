-- Verificación de tipo de datos BIGINT para usu_cedula
-- =====================================================

-- Consulta para verificar el tipo de datos de todas las columnas usu_cedula
SELECT 
    TABLE_NAME as tabla,
    COLUMN_NAME as columna,
    DATA_TYPE as tipo_dato,
    IS_NULLABLE as permite_null,
    COLUMN_KEY as tipo_clave
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'automatizacion2' 
  AND COLUMN_NAME = 'usu_cedula'
ORDER BY TABLE_NAME;

-- Verificar que todos los tipos sean BIGINT
-- Debería mostrar:
-- usuarios_info: BIGINT (PK)
-- hojas_de_vida: BIGINT (FK)
-- notificaciones: BIGINT (FK)
-- configuraciones_ia: BIGINT (FK)
-- favoritos: BIGINT (FK)
-- vacantes: BIGINT (FK)
-- postulaciones: BIGINT (FK)
-- entrevistas: BIGINT (FK)
-- contratos: BIGINT (FK)
-- programaciones_grupales: BIGINT (FK)
-- programaciones_individuales: BIGINT (FK)
-- evidencias_grupales: BIGINT (FK)
-- evidencias_individuales: BIGINT (FK)
-- informes: BIGINT (FK)

-- Consulta de rangos para verificar capacidad
SELECT 
    'INT' as tipo,
    'Rango: -2,147,483,648 a 2,147,483,647' as rango_signed,
    'Rango: 0 a 4,294,967,295' as rango_unsigned
UNION ALL
SELECT 
    'BIGINT' as tipo,
    'Rango: -9,223,372,036,854,775,808 a 9,223,372,036,854,775,807' as rango_signed,
    'Rango: 0 a 18,446,744,073,709,551,615' as rango_unsigned;

-- Valores máximos en nuestros datos:
-- Consultores: 1001234567 - 1078901234 (dentro de rango INT)
-- Profesionales: 2000000001 - 2000000004 (fuera de rango INT)
-- Reclutadores: 3000000001 (fuera de rango INT) 