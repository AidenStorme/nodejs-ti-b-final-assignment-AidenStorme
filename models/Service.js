const mongoose = require("mongoose");

const healthCheckSchema = new mongoose.Schema(
  {
    laatsteCheck: { type: Date },
    status: { type: String },
  },
  { _id: false },
);

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  internalPort: { type: Number, min: 1, max: 65535 },
  publicUrl: { type: String },
  replicas: { type: Number, default: 1, min: 1 },
  envVars: {
    type: Map,
    of: String,
    default: {},
  },
  servers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Server" }],
  healthCheck: healthCheckSchema,
});

module.exports = mongoose.model("Service", serviceSchema);
