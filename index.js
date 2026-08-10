const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI ontbreekt in .env');
    }

    await mongoose.connect(MONGO_URI);
    console.log('Verbonden met MongoDB');

    app.listen(PORT, () => {
      console.log(`Server draait op poort ${PORT}`);
    });
  } catch (err) {
    console.error(`Kan niet opstarten: ${err.message}`);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Onverwerkte promise-rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Ongevangen exception, server wordt netjes afgesloten:', err);
  process.exit(1);
});