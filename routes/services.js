const express = require("express");
const Service = require("../models/Service");
const Server = require("../models/Server");
const validateObjectId = require("../middleware/validateObjectId");
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * Toegangsmatrix — routes/services.js
 *
 * | Endpoint    | Gast | User                    | Admin |
 * |-------------|------|-------------------------|-------|
 * | GET /       |  -   |  ja                     |  ja   |
 * | GET /:id    |  -   |  ja                     |  ja   |
 * | POST /      |  -   |  ja                     |  ja   |
 * | PUT /:id    |  -   |  ja (owner van server)  |  ja   |
 * | DELETE /:id |  -   |  -                      |  ja   |
 */

const router = express.Router();

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const services = await Service.find().populate("servers", "hostname ip");
    res.json(services);
  }),
);

router.get(
  "/:id",
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id).populate(
      "servers",
      "hostname ip",
    );
    if (!service) {
      return res.status(404).json({ error: "Service niet gevonden" });
    }
    res.json(service);
  }),
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  }),
);

router.put(
  "/:id",
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service niet gevonden" });
    }
    if (req.user.role !== "admin") {
      const ownedServer = await Server.findOne({
        _id: { $in: service.servers },
        owner: req.user.id,
      });
      if (!ownedServer) {
        return res.status(403).json({ error: "Geen toegang" });
      }
    }
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
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
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service niet gevonden" });
    }
    res.json({ message: "Service verwijderd" });
  }),
);

module.exports = router;
