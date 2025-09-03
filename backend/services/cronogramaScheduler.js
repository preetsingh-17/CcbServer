const cron = require('node-cron');
const { executeQuery } = require('../config/database');

class CronogramaScheduler {
    constructor() {
        this.isRunning = false;
        this.lastExecution = null;
        this.stats = {
            totalExecutions: 0,
            totalNotifications: 0,
            lastError: null
        };
    }

    // Iniciar el scheduler - se ejecuta todos los días a las 8:00 AM
    start() {
        console.log('🕒 Iniciando Cronograma Scheduler...');
        
        // Ejecutar todos los días a las 8:00 AM
        cron.schedule('0 8 * * *', async () => {
            await this.ejecutarRevisionDiaria();
        }, {
            scheduled: true,
            timezone: "America/Bogota"
        });

        // También ejecutar cada hora entre las 8 AM y 6 PM para verificaciones adicionales
        cron.schedule('0 8-18 * * *', async () => {
            await this.verificacionHoraria();
        }, {
            scheduled: true,
            timezone: "America/Bogota"
        });

        console.log('✅ Cronograma Scheduler iniciado correctamente');
        console.log('📅 Programado para ejecutarse diariamente a las 8:00 AM');
        console.log('🔄 Verificaciones adicionales cada hora de 8 AM a 6 PM');
    }

    // Función principal que se ejecuta diariamente
    async ejecutarRevisionDiaria() {
        if (this.isRunning) {
            console.log('⚠️ Cronograma Scheduler ya está ejecutándose, saltando...');
            return;
        }

        try {
            this.isRunning = true;
            this.stats.totalExecutions++;
            this.lastExecution = new Date();

            console.log(`📋 Ejecutando revisión diaria del cronograma CCB - ${this.lastExecution.toISOString()}`);

            // 1. Obtener notificaciones que deben enviarse hoy
            const notificacionesPendientes = await this.obtenerNotificacionesPendientes();
            
            if (notificacionesPendientes.length === 0) {
                console.log('✅ No hay notificaciones programadas para enviar hoy');
                return;
            }

            console.log(`📤 Se encontraron ${notificacionesPendientes.length} tipos de notificación para enviar`);

            // 2. Obtener gestoras activas
            const gestoras = await this.obtenerGestorasActivas();
            
            if (gestoras.length === 0) {
                console.log('⚠️ No se encontraron gestoras activas');
                return;
            }

            console.log(`👥 Se enviarán notificaciones a ${gestoras.length} gestoras`);

            // 3. Enviar notificaciones
            const resultados = await this.enviarNotificacionesAutomaticas(notificacionesPendientes, gestoras);
            
            this.stats.totalNotifications += resultados.enviadas;
            
            console.log(`✅ Revisión completada:`);
            console.log(`   - Notificaciones enviadas: ${resultados.enviadas}`);
            console.log(`   - Errores: ${resultados.errores.length}`);

            if (resultados.errores.length > 0) {
                console.error('❌ Errores encontrados:');
                resultados.errores.forEach(error => {
                    console.error(`   - ${error.gestora}: ${error.error}`);
                });
            }

        } catch (error) {
            this.stats.lastError = error.message;
            console.error('❌ Error en revisión diaria del cronograma:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Verificación ligera cada hora para alertas urgentes
    async verificacionHoraria() {
        try {
            const alertasUrgentes = await this.obtenerAlertasUrgentes();
            
            if (alertasUrgentes.length > 0) {
                console.log(`🚨 ${alertasUrgentes.length} alertas urgentes detectadas:`);
                alertasUrgentes.forEach(alerta => {
                    console.log(`   - ${alerta.mes_ejecucion}: ${alerta.alerta_urgente} (${alerta.color_urgencia})`);
                });
            }
        } catch (error) {
            console.error('❌ Error en verificación horaria:', error);
        }
    }

    // Obtener notificaciones que deben enviarse hoy
    async obtenerNotificacionesPendientes() {
        const query = `
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
                        WHEN c.fecha_maxima_facturacion = 'por confirmar' THEN NULL
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
                    OR (nc.tipo_fecha = 'facturacion' AND c.fecha_maxima_facturacion != 'por confirmar' 
                        AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = nc.dias_anticipacion)
                )
        `;

        const result = await executeQuery(query);
        
        if (!result.success) {
            throw new Error('Error al obtener notificaciones pendientes');
        }

        return result.data;
    }

    // Obtener gestoras activas
    async obtenerGestorasActivas() {
        const query = `
            SELECT DISTINCT 
                ui.usu_cedula, 
                ui.usu_primer_nombre, 
                ui.usu_primer_apellido, 
                c.usu_correo
            FROM usuarios_info ui
            INNER JOIN cuentas c ON ui.usu_id = c.usu_id
            WHERE c.usu_tipo IN ('Profesional', 'Administrador')
                AND c.usu_activo = TRUE
        `;

        const result = await executeQuery(query);
        
        if (!result.success) {
            throw new Error('Error al obtener gestoras activas');
        }

        return result.data;
    }

    // Enviar notificaciones automáticamente
    async enviarNotificacionesAutomaticas(notificaciones, gestoras) {
        let enviadas = 0;
        const errores = [];

        for (const notificacion of notificaciones) {
            for (const gestora of gestoras) {
                try {
                    // Verificar si ya se envió esta notificación hoy para evitar duplicados
                    const yaEnviada = await this.verificarNotificacionYaEnviada(
                        gestora.usu_cedula, 
                        notificacion.mes_ejecucion, 
                        notificacion.tipo_fecha
                    );

                    if (yaEnviada) {
                        console.log(`📝 Notificación ya enviada hoy para ${gestora.usu_correo} - ${notificacion.tipo_fecha} ${notificacion.mes_ejecucion}`);
                        continue;
                    }

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

                    const titulo = `📅 Cronograma CCB - ${notificacion.mes_ejecucion}`;
                    const mensaje = notificacion.mensaje_plantilla;

                    await executeQuery(insertQuery, [
                        gestora.usu_cedula,
                        titulo,
                        mensaje
                    ]);

                    enviadas++;
                    console.log(`✅ Notificación enviada a ${gestora.usu_correo}: ${notificacion.tipo_fecha} - ${notificacion.mes_ejecucion}`);

                } catch (error) {
                    errores.push({
                        gestora: gestora.usu_correo,
                        notificacion: `${notificacion.tipo_fecha} - ${notificacion.mes_ejecucion}`,
                        error: error.message
                    });
                }
            }
        }

        return { enviadas, errores };
    }

    // Verificar si una notificación ya fue enviada hoy
    async verificarNotificacionYaEnviada(cedula, mes, tipoFecha) {
        const query = `
            SELECT COUNT(*) as count
            FROM notificaciones 
            WHERE usu_cedula = ?
                AND not_tipo = 'cronograma_ccb'
                AND not_titulo LIKE CONCAT('%', ?, '%')
                AND not_mensaje LIKE CONCAT('%', ?, '%')
                AND DATE(not_fecha_hora) = CURDATE()
        `;

        const result = await executeQuery(query, [cedula, mes, tipoFecha]);
        
        if (!result.success) {
            return false; // En caso de error, permitir envío
        }

        return result.data[0].count > 0;
    }

    // Obtener alertas urgentes para verificación horaria
    async obtenerAlertasUrgentes() {
        const query = `
            SELECT 
                c.mes_ejecucion,
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) BETWEEN 0 AND 1 THEN 
                        CONCAT('📤 Envío informes ', c.mes_ejecucion, ' - ', DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()), ' días')
                    WHEN DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) BETWEEN 0 AND 1 THEN 
                        CONCAT('🔄 Subsanaciones ', c.mes_ejecucion, ' - ', DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()), ' días')
                    WHEN c.fecha_maxima_facturacion != 'por confirmar' AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = 0 THEN 
                        CONCAT('💰 Facturación ', c.mes_ejecucion, ' - HOY')
                    ELSE NULL
                END as alerta_urgente,
                CASE 
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = 0 OR 
                         DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) = 0 OR
                         (c.fecha_maxima_facturacion != 'por confirmar' AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = 0) THEN 'red'
                    WHEN DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) = 1 OR 
                         DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) = 1 THEN 'orange'
                    ELSE 'yellow'
                END as color_urgencia
            FROM cronograma_informes_ccb c
            WHERE c.activo = TRUE
                AND (
                    DATEDIFF(c.fecha_maxima_envio_ccb, CURDATE()) BETWEEN 0 AND 1
                    OR DATEDIFF(c.fecha_maxima_subsanacion, CURDATE()) BETWEEN 0 AND 1
                    OR (c.fecha_maxima_facturacion != 'por confirmar' AND DATEDIFF(c.fecha_maxima_facturacion, CURDATE()) = 0)
                )
        `;

        const result = await executeQuery(query);
        
        if (!result.success) {
            throw new Error('Error al obtener alertas urgentes');
        }

        return result.data.filter(item => item.alerta_urgente !== null);
    }

    // Ejecutar manualmente (para testing)
    async ejecutarManualmente() {
        console.log('🔧 Ejecutando Cronograma Scheduler manualmente...');
        await this.ejecutarRevisionDiaria();
    }

    // Obtener estadísticas del scheduler
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            lastExecution: this.lastExecution,
            nextExecution: 'Diariamente a las 8:00 AM'
        };
    }

    // Detener el scheduler
    stop() {
        console.log('🛑 Deteniendo Cronograma Scheduler...');
        this.isRunning = false;
    }
}

// Crear instancia singleton
const cronogramaScheduler = new CronogramaScheduler();

module.exports = cronogramaScheduler; 