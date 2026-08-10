const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
  affectedService: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timeline: [timelineEntrySchema],
});

module.exports = mongoose.model('Incident', incidentSchema);