const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

const usersRouter = require("./routes/users");
const serversRouter = require("./routes/servers");
const servicesRouter = require("./routes/services");
const incidentsRouter = require("./routes/incidents");
const authRouter = require("./routes/auth");

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message:
      "Node.js Eindwerk API - zie /api/health of README voor documentatie",
  });
});

app.use("/api/users", usersRouter);
app.use("/api/servers", serversRouter);
app.use("/api/services", servicesRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/auth", authRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: "Email is al in gebruik" });
  }
  res
    .status(err.status || 500)
    .json({ error: err.message || "Er ging iets mis op de server" });
});

module.exports = app;
