require('dotenv').config();
const app = require('./app');
const models = require('./models');
const PORT = process.env.PORT || 3000;

// Test DB
models.sequelize
  .authenticate()
  .then(() => {
    console.log('Database terhubung');

    // Sync DB
    if (process.env.NODE_ENV === 'development') {
      models.sequelize.sync({ alter: true }).then(() => {
        console.log('Database synced (alter mode)');

        // Start server
        app.listen(PORT, () => {
          console.log(`Server berjalan di port ${PORT}`);
        });
      });
    } else {
      // Start server
      app.listen(PORT, () => {
        console.log(`Server berjalan di port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('Gagal terhubung ke database:', err);
    process.exit(1);
  });
