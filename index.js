const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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