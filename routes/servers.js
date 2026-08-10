const express = require("express");
const Server = require("../models/Server");
const Service = require("../models/Service");
const validateObjectId = require("../middleware/validateObjectId");
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * Toegangsmatrix — routes/servers.js
 *
 * | Endpoint          | Gast | User        | Admin |
 * |-------------------|------|-------------|-------|
 * | GET /             |  -   |  ja         |  ja   |
 * | GET /:id          |  -   |  ja         |  ja   |
 * | POST /            |  -   |  ja         |  ja   |
 * | GET /:id/services |  -   |  ja         |  ja   |
 * | PUT /:id          |  -   |  ja (owner) |  ja   |
 * | DELETE /:id       |  -   |  -          |  ja   |
 */

const router = express.Router();

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const servers = await Server.find().populate("owner", "name email");
    res.json(servers);
  }),
);

router.get(
  "/:id",
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const server = await Server.findById(req.params.id).populate(
      "owner",
      "name email",
    );
    if (!server) {
      return res.status(404).json({ error: "Server niet gevonden" });
    }
    res.json(server);
  }),
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const server = await Server.create({
      ...req.body,
      owner: req.user.id,
    });
    res.status(201).json(server);
  }),
);

router.put(
  "/:id",
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: "Server niet gevonden" });
    }
    if (server.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Geen toegang" });
    }
    const updated = await Server.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    res.json(updated);
  }),
);

router.delete(
  "/:id",
  validateObjectId,
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const server = await Server.findByIdAndDelete(req.params.id);
    if (!server) {
      return res.status(404).json({ error: "Server niet gevonden" });
    }
    res.json({ message: "Server verwijderd" });
  }),
);

router.get(
  "/:id/services",
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: "Server niet gevonden" });
    }
    const services = await Service.find({ servers: req.params.id });
    res.json(services);
  }),
);

module.exports = router;
