# Variables de entorno requeridas

Crea un archivo `.env` dentro de `backend/` con los siguientes valores (ajusta según tu entorno):

```
# Entorno
NODE_ENV=production
PORT=5000

# CORS
CORS_ORIGIN=https://tu-dominio-frontend.com

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=contrasena
DB_NAME=ccb

# JWT
JWT_SECRET=cambia-este-valor-por-uno-seguro

# Scheduler (si aplica)
CRON_TIME=*/10 * * * *
```
