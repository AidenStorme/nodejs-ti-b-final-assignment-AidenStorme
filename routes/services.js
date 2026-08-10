const express = require('express');
const Service = require('../models/Service');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const services = await Service.find().populate('servers', 'hostname ip');
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('servers', 'hostname ip');
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service niet gevonden' });
    }
    res.json({ message: 'Service verwijderd' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;