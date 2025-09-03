const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const cronogramaScheduler = require('../services/cronogramaScheduler');

// GET /cronograma/fechas-limite
// Obtener próximas fechas límite del cronograma CCB
router.get('/fechas-limite', authenticateToken, async (req, res) => {
    try {
        // Solo gestoras y profesionales pueden ver las fechas límite
        if (!['Profesional', 'Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo profesionales pueden acceder al cronograma.' 
            });
        }

        const query = `
            SELECT 
                c.cronograma_id,
                c.mes_ejecucion,
                c.fecha_maxima_envio_ccb,
                DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) as dias_hasta_envio,
                c.fecha_maxima_revision_ccb,
                DATEDIFF(c.fecha_maxima_revision_ccb, CURDATE()) as dias_hasta_revision,
                c.fecha_maxima_subsanacion,
                DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) as dias_hasta_subsanacion,
                c.fecha_maxima_aprobacion_final,
                DATEDIFF(c.fecha_maxima_aprobacion_final, CURDATE()) as dias_hasta_aprobacion,
                c.fecha_maxima_facturacion,
                CASE 
                    WHEN c.fecha_maxima_facturacion IS NULL THEN NULL
                    ELSE DATEDIFF(c.fecha_maxima_facturacion, CURDATE())
                END as dias_hasta_facturacion,
                c.descripcion,
                -- Determinar urgencia basada en días restantes
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) <= 1 THEN 'urgente'
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) <= 3 THEN 'proximo'
                    ELSE 'normal'
                END as urgencia
            FROM cronograma_informes_ccb c
            WHERE c.activo = TRUE
            ORDER BY c.fecha_maxima_envio_ccb ASC
        `;

        const result = await executeQuery(query);

        if (!result.success) {
            throw new Error('Error al obtener fechas límite desde la base de datos.');
        }

        res.json({ 
            success: true, 
            data: result.data,
            message: 'Fechas límite obtenidas correctamente'
        });

    } catch (error) {
        console.error("Error en endpoint fechas-limite:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

// GET /cronograma/notificaciones-pendientes
// Obtener notificaciones que deben enviarse hoy basadas en el cronograma
router.get('/notificaciones-pendientes', authenticateToken, async (req, res) => {
    try {
        // Solo administradores o el sistema puede consultar notificaciones pendientes
        if (!['Profesional', 'Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado.' 
            });
        }

        const query = `
            SELECT 
                nc.notif_cron_id,
                nc.tipo_fecha,
                nc.dias_anticipacion,
                nc.mensaje_plantilla,
                c.mes_ejecucion,
                c.fecha_maxima_envio_ccb,
                c.fecha_maxima_revision_ccb,
                c.fecha_maxima_subsanacion,
                c.fecha_maxima_aprobacion_final,
                c.fecha_maxima_facturacion,
                CASE nc.tipo_fecha
                    WHEN 'envio_ccb' THEN c.fecha_maxima_envio_ccb
                    WHEN 'revision_ccb' THEN c.fecha_maxima_revision_ccb
                    WHEN 'subsanacion' THEN c.fecha_maxima_subsanacion
                    WHEN 'aprobacion_final' THEN c.fecha_maxima_aprobacion_final
                    WHEN 'facturacion' THEN CASE 
                        WHEN c.fecha_maxima_facturacion IS NULL THEN NULL
                        ELSE c.fecha_maxima_facturacion
                    END
                END as fecha_objetivo,
                CASE nc.tipo_fecha
                    WHEN 'envio_ccb' THEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE())
                    WHEN 'revision_ccb' THEN DATEDIFF(c.fecha_maxima_revision_ccb, CURDATE())
                    WHEN 'subsanacion' THEN DATEDIFF(c.fecha_maxima_subsanacion, CURDATE())
                    WHEN 'aprobacion_final' THEN DATEDIFF(c.fecha_maxima_aprobacion_final, CURDATE())
                    WHEN 'facturacion' THEN CASE 
                        WHEN c.fecha_maxima_facturacion IS NULL THEN NULL
                        ELSE DATEDIFF(c.fecha_maxima_facturacion, CURDATE())
                    END
                END as dias_restantes
            FROM notificaciones_cronograma nc
            INNER JOIN cronograma_informes_ccb c ON nc.cronograma_id = c.cronograma_id
            WHERE nc.activo = TRUE 
                AND c.activo = TRUE
                AND (
                    (nc.tipo_fecha = 'envio_ccb' AND DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'revision_ccb' AND DATEDIFF(c.fecha_maxima_revision_ccb, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'subsanacion' AND DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'aprobacion_final' AND DATEDIFF(c.fecha_maxima_aprobacion_final, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'facturacion' AND c.fecha_maxima_facturacion IS NOT NULL 
                        AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = nc.dias_anticipacion)
                )
            ORDER BY fecha_objetivo ASC
        `;

        const result = await executeQuery(query);

        if (!result.success) {
            throw new Error('Error al obtener notificaciones pendientes desde la base de datos.');
        }

        res.json({ 
            success: true, 
            data: result.data,
            message: `${result.data.length} notificaciones pendientes encontradas`
        });

    } catch (error) {
        console.error("Error en endpoint notificaciones-pendientes:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

// POST /cronograma/enviar-notificaciones
// Enviar notificaciones a todas las gestoras basadas en el cronograma
router.post('/enviar-notificaciones', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden ejecutar envío masivo de notificaciones
        if (!['Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo administradores pueden enviar notificaciones masivas.' 
            });
        }

        // 1. Obtener notificaciones que deben enviarse hoy
        const notificacionesQuery = `
            SELECT 
                nc.notif_cron_id,
                nc.tipo_fecha,
                nc.mensaje_plantilla,
                c.mes_ejecucion,
                CASE nc.tipo_fecha
                    WHEN 'envio_ccb' THEN c.fecha_maxima_envio_ccb
                    WHEN 'revision_ccb' THEN c.fecha_maxima_revision_ccb
                    WHEN 'subsanacion' THEN c.fecha_maxima_subsanacion
                    WHEN 'aprobacion_final' THEN c.fecha_maxima_aprobacion_final
                    WHEN 'facturacion' THEN CASE 
                        WHEN c.fecha_maxima_facturacion IS NULL THEN NULL
                        ELSE c.fecha_maxima_facturacion
                    END
                END as fecha_objetivo
            FROM notificaciones_cronograma nc
            INNER JOIN cronograma_informes_ccb c ON nc.cronograma_id = c.cronograma_id
            WHERE nc.activo = TRUE 
                AND c.activo = TRUE
                AND (
                    (nc.tipo_fecha = 'envio_ccb' AND DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'revision_ccb' AND DATEDIFF(c.fecha_maxima_revision_ccb, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'subsanacion' AND DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'aprobacion_final' AND DATEDIFF(c.fecha_maxima_aprobacion_final, CURDATE()) = nc.dias_anticipacion)
                    OR (nc.tipo_fecha = 'facturacion' AND c.fecha_maxima_facturacion IS NOT NULL 
                        AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = nc.dias_anticipacion)
                )
        `;

        const notificacionesResult = await executeQuery(notificacionesQuery);
        
        if (!notificacionesResult.success) {
            throw new Error('Error al obtener notificaciones pendientes');
        }

        if (notificacionesResult.data.length === 0) {
            return res.json({ 
                success: true, 
                data: [],
                message: 'No hay notificaciones programadas para enviar hoy'
            });
        }

        // 2. Obtener todas las gestoras/profesionales activos
        const gestorasQuery = `
            SELECT DISTINCT ui.usu_cedula, ui.usu_primer_nombre, ui.usu_primer_apellido, c.usu_correo
            FROM usuarios_info ui
            INNER JOIN cuentas c ON ui.usu_id = c.usu_id
            WHERE c.usu_tipo IN ('Profesional', 'Administrador')
                AND c.usu_activo = TRUE
        `;

        const gestorasResult = await executeQuery(gestorasQuery);
        
        if (!gestorasResult.success) {
            throw new Error('Error al obtener gestoras activas');
        }

        // 3. Enviar notificaciones a cada gestora
        let notificacionesEnviadas = 0;
        const errores = [];

        for (const notificacion of notificacionesResult.data) {
            for (const gestora of gestorasResult.data) {
                try {
                    const insertQuery = `
                        INSERT INTO notificaciones (
                            usu_cedula, 
                            not_titulo, 
                            not_mensaje, 
                            not_fecha_hora, 
                            not_leida, 
                            not_tipo
                        ) VALUES (?, ?, ?, NOW(), FALSE, 'cronograma_ccb')
                    `;

                    const titulo = `Cronograma CCB - ${notificacion.mes_ejecucion}`;
                    const mensaje = notificacion.mensaje_plantilla;

                    await executeQuery(insertQuery, [
                        gestora.usu_cedula,
                        titulo,
                        mensaje
                    ]);

                    notificacionesEnviadas++;
                } catch (error) {
                    errores.push({
                        gestora: gestora.usu_correo,
                        notificacion: notificacion.tipo_fecha,
                        error: error.message
                    });
                }
            }
        }

        res.json({ 
            success: true, 
            data: {
                notificaciones_enviadas: notificacionesEnviadas,
                total_gestoras: gestorasResult.data.length,
                total_tipos_notificacion: notificacionesResult.data.length,
                errores: errores
            },
            message: `${notificacionesEnviadas} notificaciones enviadas correctamente`
        });

    } catch (error) {
        console.error("Error en endpoint enviar-notificaciones:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

// GET /cronograma/próximas-alertas
// Obtener alertas específicas para mostrar en el dashboard
router.get('/proximas-alertas', authenticateToken, async (req, res) => {
    try {
        // Verificar que el usuario tenga acceso
        if (!['Profesional', 'Administrador', 'Consultor'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado.' 
            });
        }

        const query = `
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
                -- Determinar la alerta más urgente
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) BETWEEN 0 AND 3 THEN 
                        CONCAT('📤 Envío informes ', c.mes_ejecucion, ' - ', DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()), ' días')
                    WHEN DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) BETWEEN 0 AND 2 THEN 
                        CONCAT('🔄 Subsanaciones ', c.mes_ejecucion, ' - ', DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()), ' días')
                    WHEN c.fecha_maxima_facturacion IS NOT NULL AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) BETWEEN 0 AND 1 THEN 
                        CONCAT('💰 Facturación ', c.mes_ejecucion, ' - ', DATEDIFF(c.fecha_maxima_facturacion, CURDATE()), ' días')
                    ELSE NULL
                END as alerta_urgente,
                -- Determinar color de urgencia
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = 0 OR 
                         DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) = 0 OR
                         (c.fecha_maxima_facturacion IS NOT NULL AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = 0) THEN 'red'
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) BETWEEN 1 AND 2 OR 
                         DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) BETWEEN 1 AND 2 OR
                         (c.fecha_maxima_facturacion IS NOT NULL AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = 1) THEN 'orange'
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = 3 THEN 'yellow'
                    ELSE 'green'
                END as color_urgencia
            FROM cronograma_informes_ccb c
            WHERE c.activo = TRUE
                AND (
                    DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) BETWEEN 0 AND 5
                    OR DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) BETWEEN 0 AND 3
                    OR (c.fecha_maxima_facturacion IS NOT NULL AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) BETWEEN 0 AND 2)
                )
            ORDER BY 
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) >= 0 THEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE())
                    ELSE 999
                END ASC
            LIMIT 5
        `;

        const result = await executeQuery(query);

        if (!result.success) {
            throw new Error('Error al obtener alertas próximas desde la base de datos.');
        }

        // Filtrar solo las alertas que tienen contenido
        const alertas = result.data.filter(item => item.alerta_urgente !== null);

        res.json({ 
            success: true, 
            data: alertas,
            message: `${alertas.length} alertas próximas encontradas`
        });

    } catch (error) {
        console.error("Error en endpoint próximas-alertas:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

// GET /cronograma/scheduler/status
// Obtener estado y estadísticas del scheduler
router.get('/scheduler/status', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden ver el estado del scheduler
        if (!['Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo administradores pueden ver el estado del scheduler.' 
            });
        }

        const stats = cronogramaScheduler.getStats();
        
        res.json({ 
            success: true, 
            data: stats,
            message: 'Estado del scheduler obtenido correctamente'
        });

    } catch (error) {
        console.error("Error en endpoint scheduler/status:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

// POST /cronograma/scheduler/ejecutar
// Ejecutar manualmente el scheduler (para testing)
router.post('/scheduler/ejecutar', authenticateToken, async (req, res) => {
    try {
        // Solo administradores pueden ejecutar manualmente
        if (!['Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo administradores pueden ejecutar el scheduler manualmente.' 
            });
        }

        // Ejecutar de forma asíncrona
        cronogramaScheduler.ejecutarManualmente()
            .then(() => {
                console.log('✅ Ejecución manual del scheduler completada');
            })
            .catch((error) => {
                console.error('❌ Error en ejecución manual del scheduler:', error);
            });

        res.json({ 
            success: true, 
            message: 'Ejecución manual del scheduler iniciada correctamente'
        });

    } catch (error) {
        console.error("Error en endpoint scheduler/ejecutar:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor.', 
            error: error.message 
        });
    }
});

module.exports = router; 