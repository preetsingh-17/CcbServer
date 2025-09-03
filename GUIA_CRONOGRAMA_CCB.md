# 📅 Sistema de Notificaciones - Cronograma CCB

Sistema automatizado para gestionar y notificar fechas límite de entrega de informes según el contrato CCB No. 6200017455/2025.

## 🎯 ¿Qué hace este sistema?

- ✅ **Almacena** todas las fechas límite del cronograma CCB en la base de datos
- ✅ **Notifica automáticamente** a las gestoras sobre fechas próximas
- ✅ **Muestra alertas visuales** en el dashboard con diferentes niveles de urgencia
- ✅ **Ejecuta verificaciones** diarias a las 8:00 AM automáticamente
- ✅ **Permite gestión manual** para administradores

## 📋 Funcionalidades Implementadas

### 1. **Base de Datos**
- Tabla `cronograma_informes_ccb` con todas las fechas del contrato
- Tabla `notificaciones_cronograma` para configurar alertas automáticas
- Vista `v_proximas_fechas_limite` para consultas rápidas

### 2. **API Endpoints**
- `GET /api/cronograma/fechas-limite` - Obtener cronograma completo
- `GET /api/cronograma/proximas-alertas` - Alertas para el dashboard
- `POST /api/cronograma/enviar-notificaciones` - Envío manual de notificaciones
- `GET /api/cronograma/scheduler/status` - Estado del programador automático

### 3. **Scheduler Automático**
- **Ejecución diaria**: Todos los días a las 8:00 AM
- **Verificaciones horarias**: De 8 AM a 6 PM para alertas urgentes
- **Prevención de duplicados**: No envía la misma notificación dos veces
- **Manejo de errores**: Logs detallados y recuperación automática

### 4. **Interfaz de Usuario**
- **Componente CronogramaAlerts**: Muestra alertas en el dashboard
- **Colores de urgencia**: Rojo (hoy), Naranja (1-2 días), Amarillo (3 días)
- **Actualización automática**: Cada 5 minutos
- **Responsive**: Funciona en móviles y escritorio

## 🚀 Instalación y Configuración

### Paso 1: Instalar Dependencias

```bash
cd backend
npm install
```

### Paso 2: Configurar Base de Datos

Ejecuta el script de creación de tablas:

```sql
-- En tu cliente MySQL, ejecuta:
source backend/scripts/cronograma_informes_ccb.sql
```

**O ejecuta manualmente:**

```bash
mysql -u root -p nombre_de_tu_base_de_datos < backend/scripts/cronograma_informes_ccb.sql
```

### Paso 3: Verificar la Instalación

1. **Iniciar el servidor backend:**
```bash
cd backend
npm run dev
```

2. **Verificar que el scheduler se inicie:**
Deberías ver en la consola:
```
🕒 Iniciando Cronograma Scheduler...
✅ Cronograma Scheduler iniciado correctamente
📅 Programado para ejecutarse diariamente a las 8:00 AM
```

3. **Probar los endpoints:**
```bash
# Obtener fechas límite (requiere autenticación)
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:5000/api/cronograma/fechas-limite

# Obtener alertas próximas
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:5000/api/cronograma/proximas-alertas
```

### Paso 4: Verificar la Interfaz

1. Inicia la aplicación frontend
2. Inicia sesión como gestora/profesional
3. Ve al dashboard principal
4. Deberías ver el componente **"📅 Cronograma CCB"** arriba del dashboard

## 📊 Cronograma Implementado

| Mes | Envío Informes | Revisión CCB | Subsanación | Aprobación | Facturación |
|-----|----------------|--------------|-------------|------------|-------------|
| **Abril** | 08/05/2025 | 13/05/2025 | 15/05/2025 | 19/05/2025 | 23/05/2025 |
| **Mayo** | 09/06/2025 | 12/06/2025 | 16/06/2025 | 17/06/2025 | 19/06/2025 |
| **Junio** | 02/07/2025 | 10/07/2025 | 14/07/2025 | 16/07/2025 | 22/07/2025 |
| **Julio** | 06/08/2025 | 13/08/2025 | 15/08/2025 | 20/08/2025 | 22/08/2025 |
| **Agosto** | 05/09/2025 | 10/09/2025 | 12/09/2025 | 16/09/2025 | 23/09/2025 |
| **Septiembre** | 07/10/2025 | 10/10/2025 | 15/10/2025 | 17/10/2025 | 24/10/2025 |
| **Octubre** | 10/11/2025 | 13/11/2025 | 18/11/2025 | 19/11/2025 | 21/11/2025 |
| **Noviembre** | 05/12/2025 | 11/12/2025 | 12/12/2025 | 16/12/2025 | Por confirmar |

## 🔔 Configuración de Notificaciones

### Tipos de Alertas Automáticas

1. **Envío de Informes** - 3 días antes
2. **Subsanaciones** - 2 días antes  
3. **Facturación** - 1 día antes

### Personalizar Notificaciones

Para cambiar los días de anticipación o mensajes:

```sql
-- Cambiar días de anticipación para envío de informes
UPDATE notificaciones_cronograma 
SET dias_anticipacion = 5 
WHERE tipo_fecha = 'envio_ccb';

-- Personalizar mensaje
UPDATE notificaciones_cronograma 
SET mensaje_plantilla = 'Tu mensaje personalizado aquí' 
WHERE tipo_fecha = 'envio_ccb' AND cronograma_id = 1;
```

## 🛠️ Administración

### Para Administradores

**Ver estado del scheduler:**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:5000/api/cronograma/scheduler/status
```

**Ejecutar manualmente:**
```bash
curl -X POST \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:5000/api/cronograma/scheduler/ejecutar
```

### Consultas Útiles

```sql
-- Ver próximas fechas límite
SELECT * FROM v_proximas_fechas_limite 
WHERE dias_hasta_envio >= 0 
LIMIT 5;

-- Ver notificaciones enviadas hoy
SELECT n.not_titulo, n.not_mensaje, ui.usu_primer_nombre, ui.usu_primer_apellido
FROM notificaciones n
JOIN usuarios_info ui ON n.usu_cedula = ui.usu_cedula
WHERE DATE(n.not_fecha_hora) = CURDATE()
  AND n.not_tipo = 'cronograma_ccb';

-- Contar notificaciones por mes
SELECT 
    SUBSTRING_INDEX(not_titulo, ' - ', -1) as mes,
    COUNT(*) as total_notificaciones
FROM notificaciones 
WHERE not_tipo = 'cronograma_ccb'
  AND DATE(not_fecha_hora) = CURDATE()
GROUP BY mes;
```

## 🎨 Personalización de la Interfaz

### Cambiar Colores de Urgencia

Edita `src/components/CronogramaAlerts.css`:

```css
/* Rojo = Urgente (hoy/mañana) */
.cronograma-alert-urgent {
    background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);
    border-left-color: #dc3545;
}

/* Naranja = Advertencia (1-2 días) */
.cronograma-alert-warning {
    background: linear-gradient(135deg, #fff3cd 0%, #fefefe 100%);
    border-left-color: #fd7e14;
}
```

### Cambiar Frecuencia de Actualización

En `src/components/CronogramaAlerts.js`:

```javascript
// Cambiar de 5 minutos a 10 minutos
const interval = setInterval(cargarAlertas, 10 * 60 * 1000);
```

## 🔧 Solución de Problemas

### El scheduler no se inicia

1. **Verifica que node-cron esté instalado:**
```bash
npm list node-cron
```

2. **Revisa los logs del servidor:**
```bash
npm run dev
# Busca mensajes de error relacionados con cronograma
```

### Las notificaciones no aparecen

1. **Verifica la fecha del sistema:**
```sql
SELECT CURDATE() as fecha_actual;
```

2. **Revisa si hay fechas próximas:**
```sql
SELECT * FROM v_proximas_fechas_limite;
```

3. **Verifica permisos del usuario:**
```sql
SELECT usu_tipo FROM cuentas WHERE usu_id = TU_USER_ID;
```

### El componente no aparece en el dashboard

1. **Verifica el import:**
```javascript
import CronogramaAlerts from '../../components/CronogramaAlerts';
```

2. **Revisa errores en la consola del navegador:**
```javascript
// Abre DevTools > Console
```

## 📈 Métricas y Monitoreo

### Ver estadísticas del scheduler

```javascript
// En el navegador (como administrador):
fetch('/api/cronograma/scheduler/status', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
})
.then(r => r.json())
.then(console.log);
```

### Monitorear notificaciones enviadas

```sql
-- Notificaciones enviadas en los últimos 7 días
SELECT 
    DATE(not_fecha_hora) as fecha,
    COUNT(*) as notificaciones_enviadas
FROM notificaciones 
WHERE not_tipo = 'cronograma_ccb'
  AND not_fecha_hora >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(not_fecha_hora)
ORDER BY fecha DESC;
```

## 🚨 Mantenimiento

### Actualizar fechas para el próximo año

1. Duplica y modifica el script SQL
2. Actualiza las fechas en `cronograma_informes_ccb`
3. Regenera las notificaciones automáticas

### Backup de configuración

```sql
-- Exportar configuración actual
SELECT * FROM cronograma_informes_ccb;
SELECT * FROM notificaciones_cronograma;
```

---

## ✅ ¡Sistema Listo!

El sistema de notificaciones del cronograma CCB está completamente configurado y funcionando. Las gestoras recibirán automáticamente notificaciones sobre fechas límite importantes, y el dashboard mostrará alertas visuales según la urgencia.

**¿Necesitas ayuda?** Revisa los logs del servidor y las consultas SQL de verificación incluidas en esta guía. 