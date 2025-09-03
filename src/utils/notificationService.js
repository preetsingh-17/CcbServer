// src/utils/notificationService.js

class NotificationService {
    // Obtiene las notificaciones del localStorage
    static getStoredNotifications() {
      const stored = localStorage.getItem('notifications');
      return stored ? JSON.parse(stored) : {};
    }
  
    // Guarda las notificaciones en localStorage
    static saveNotifications(notifications) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  
    // Añade una notificación para un consultor específico
    static addNotification(consultorEmail, notification) {
      const notifications = this.getStoredNotifications();
      if (!notifications[consultorEmail]) {
        notifications[consultorEmail] = [];
      }
      notifications[consultorEmail].push({
        ...notification,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false
      });
      this.saveNotifications(notifications);
      console.log(`📬 Nueva notificación para ${consultorEmail}:`, notification);
    }
  
    // Obtiene las notificaciones de un consultor
    static getNotifications(consultorEmail) {
      const notifications = this.getStoredNotifications();
      return notifications[consultorEmail] || [];
    }
  
    // Marca una notificación como leída
    static markAsRead(consultorEmail, notificationId) {
      const notifications = this.getStoredNotifications();
      const userNotifications = notifications[consultorEmail];
      if (userNotifications) {
        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          this.saveNotifications(notifications);
          console.log(`✓ Notificación ${notificationId} marcada como leída para ${consultorEmail}`);
        }
      }
    }
  
    // Notifica al consultor sobre una nueva programación
    static notifyNewProgramacion(programacion) {
      if (!programacion.emailConsultor) {
        console.error('❌ Error: No se proporcionó el email del consultor');
        return;
      }
  
      const notification = {
        type: 'nueva_programacion',
        title: `Nueva ${programacion.tipoActividad}: ${programacion.tematica}`,
        message: `Se te ha asignado una nueva actividad para el ${programacion.fecha} a las ${programacion.horaInicio}`,
        data: programacion
      };
  
      console.log(`🔔 Enviando notificación a ${programacion.emailConsultor}:`, notification);
      this.addNotification(programacion.emailConsultor, notification);
    }
  }
  
  export default NotificationService;