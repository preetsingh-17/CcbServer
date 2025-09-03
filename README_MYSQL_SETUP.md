# Configuración de Conexión MySQL para CCB

Esta guía te ayudará a configurar la conexión a MySQL para tu aplicación CCB.

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- MySQL Server (versión 5.7 o superior)
- npm o yarn

## 🗄️ Configuración de la Base de Datos

### 1. Instalar MySQL

Si no tienes MySQL instalado:
- **Windows**: Descarga desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- **macOS**: Usa Homebrew: `brew install mysql`
- **Ubuntu/Debian**: `sudo apt install mysql-server`

### 2. Crear la Base de Datos

Conecta a MySQL como administrador:
```bash
mysql -u root -p
```

Ejecuta el script de inicialización que está en `backend/scripts/init-database.sql`:
```sql
source /ruta/a/tu/proyecto/backend/scripts/init-database.sql
```

O copia y pega el contenido del archivo directamente en MySQL.

## 🚀 Configuración del Backend

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Configuración de la Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=ccb_database

# Configuración del Servidor
PORT=5000
NODE_ENV=development

# JWT Secret para autenticación (cambia esto por algo seguro)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_123456789

# CORS Origin
CORS_ORIGIN=http://localhost:3000
```

**⚠️ IMPORTANTE**: Reemplaza `tu_password_mysql` con tu contraseña real de MySQL.

### 3. Iniciar el Servidor Backend

```bash
# Modo desarrollo (con nodemon)
npm run dev

# O modo producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

### 4. Verificar Conexión

Prueba que el backend esté funcionando:
- `http://localhost:5000/api/health` - Estado del servidor
- `http://localhost:5000/api/test-db` - Prueba de conexión a MySQL

## 🎨 Configuración del Frontend

### 1. Actualizar el Frontend

El frontend ya está configurado para conectarse al backend. Solo asegúrate de que el backend esté corriendo en el puerto 5000.

### 2. Variables de Entorno del Frontend (Opcional)

Si quieres cambiar la URL del backend, crea un archivo `.env` en la raíz del proyecto frontend:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Iniciar el Frontend

```bash
# En la raíz del proyecto (donde está el package.json del frontend)
npm start
```

## 👥 Usuarios de Prueba

El script de inicialización crea estos usuarios de prueba:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| testgestora | password | gestora |
| testconsultor | password | consultor |
| testreclutador | password | reclutador |

## 🔧 Resolución de Problemas

### Error de Conexión a MySQL

1. **Verificar que MySQL esté corriendo**:
   ```bash
   # Windows
   net start mysql

   # macOS/Linux
   sudo systemctl start mysql
   ```

2. **Verificar credenciales en .env**:
   - Usuario y contraseña correctos
   - Base de datos existe
   - Host y puerto correctos

3. **Verificar permisos**:
   ```sql
   GRANT ALL PRIVILEGES ON ccb_database.* TO 'tu_usuario'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Error de Autenticación

1. **Verificar que el JWT_SECRET esté configurado**
2. **Limpiar localStorage del navegador**
3. **Verificar que los usuarios existan en la base de datos**

### Puerto en Uso

Si el puerto 5000 está ocupado, cambia el `PORT` en el archivo `.env` del backend.

## 📁 Estructura de Archivos

```
proyecto/
├── backend/
│   ├── config/
│   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── consultores.js
│   │   │   ├── eventos.js
│   │   │   ├── pagos.js
│   │   │   ├── evidencias.js
│   │   │   └── vacantes.js
│   │   ├── scripts/
│   │   │   └── init-database.sql
│   │   ├── .env (crear este archivo)
│   │   ├── server.js
│   │   └── package.json
│   ├── src/
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   └── ...
```

## 🔐 Seguridad

Para producción:
1. Cambia el `JWT_SECRET` por algo más seguro
2. Usa HTTPS
3. Cambia las contraseñas por defecto
4. Configura un firewall para MySQL
5. Usa variables de entorno seguras

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor backend
2. Verifica la consola del navegador
3. Asegúrate de que MySQL esté corriendo
4. Verifica que todas las dependencias estén instaladas

¡Listo! Tu aplicación CCB ahora está conectada a MySQL. 🎉 