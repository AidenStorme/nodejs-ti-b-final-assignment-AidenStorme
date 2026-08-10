const express = require('express');
const Incident = require('../models/Incident');
const validateObjectId = require('../middleware/validateObjectId');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * Toegangsmatrix — routes/incidents.js
 *
 * | Endpoint    | Gast | User                  | Admin |
 * |-------------|------|-----------------------|-------|
 * | GET /       |  -   |  ja                   |  ja   |
 * | GET /:id    |  -   |  ja                   |  ja   |
 * | POST /      |  -   |  ja                   |  ja   |
 * | PUT /:id    |  -   |  ja (reportedBy)      |  ja   |
 * | DELETE /:id |  -   |  -                    |  ja   |
 */

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const incidents = await Incident.find(filter)
      .populate('affectedService', 'name')
      .populate('reportedBy', 'name email');
    res.json(incidents);
  })
);

router.get(
  '/:id',
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id)
      .populate('affectedService', 'name')
      .populate('reportedBy', 'name email');
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    res.json(incident);
  })
);

router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const incident = await Incident.create(req.body);
    res.status(201).json(incident);
  })
);

router.put(
  '/:id',
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    if (incident.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Geen toegang' });
    }
    const updated = await Incident.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  validateObjectId,
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    res.json({ message: 'Incident verwijderd' });
  })
);

module.exports = router;