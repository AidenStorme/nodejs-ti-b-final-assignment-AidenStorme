const express = require('express');
const Incident = require('../models/Incident');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const incidents = await Incident.find(filter)
      .populate('affectedService', 'name')
      .populate('reportedBy', 'name email');
    res.json(incidents);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('affectedService', 'name')
      .populate('reportedBy', 'name email');
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    res.json(incident);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    res.status(201).json(incident);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateObjectId, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    res.json(incident);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident niet gevonden' });
    }
    res.json({ message: 'Incident verwijderd' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;