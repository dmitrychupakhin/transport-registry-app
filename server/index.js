require('dotenv').config();
const app = require('./app');
const sequelize = require('./db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // sync в проде = осторожно! в тестах лучше force: true
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.error(e);
  }
};

start();
