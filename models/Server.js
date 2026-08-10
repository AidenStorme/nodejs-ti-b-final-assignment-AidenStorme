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
  ip: { type: String, required: true },
  os: { type: String, required: true },
  cpuCores: { type: Number, required: true },
  ramGB: { type: Number, required: true },
  storageGB: { type: Number, required: true },
  status: { type: String, enum: ['running', 'stopped', 'error'] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  installedApps: [installedAppSchema],
});

module.exports = mongoose.model('Server', serverSchema);