const express = require('express');
const Service = require('../models/Service');
const Server = require('../models/Server');
const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

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

router.get('/', auth, async (req, res) => {
  try {
    const services = await Service.find().populate('servers', 'hostname ip');
    res.json(services);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', validateObjectId, auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('servers', 'hostname ip');
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    res.json(service);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateObjectId, auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    if (req.user.role !== 'admin') {
      const ownedServer = await Server.findOne({
        _id: { $in: service.servers },
        owner: req.user.id,
      });
      if (!ownedServer) {
        return res.status(403).json({ error: 'Geen toegang' });
      }
    }
    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', validateObjectId, auth, admin, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    res.json({ message: 'Service verwijderd' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;