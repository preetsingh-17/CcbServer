module.exports = {
  apps: [
    {
      name: 'ccb-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        CORS_ORIGIN: 'https://tu-dominio-frontend.com'
      }
    }
  ]
};
