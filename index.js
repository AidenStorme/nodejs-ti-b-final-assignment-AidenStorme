const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const usersRouter = require('./routes/users');
const serversRouter = require('./routes/servers');
const servicesRouter = require('./routes/services');
const incidentsRouter = require('./routes/incidents');
const authRouter = require('./routes/auth');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);
app.use('/api/servers', serversRouter);
app.use('/api/services', servicesRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Email is al in gebruik' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Er ging iets mis op de server' });
});

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
