const mongoose = require('mongoose');

const installedAppSchema = new mongoose.Schema(
  {
    naam: { type: String, required: true },
    versie: { type: String, required: true },
  },
  { _id: false }
);

const serverSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  ip: {
    type: String,
    required: true,
    validate: {
      validator: (value) => {
        const parts = value.split('.');
        return (
          parts.length === 4 &&
          parts.every((part) => {
            if (!/^\d+$/.test(part)) return false;
            const num = Number(part);
            return num >= 0 && num <= 255 && String(num) === part;
          })
        );
      },
      message: (props) => `${props.value} is geen geldig IPv4-adres`,
    },
  },
  os: { type: String, required: true },
  cpuCores: { type: Number, required: true, min: 0 },
  ramGB: { type: Number, required: true, min: 0 },
  storageGB: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['running', 'stopped', 'error'] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  installedApps: [installedAppSchema],
});

module.exports = mongoose.model('Server', serverSchema);