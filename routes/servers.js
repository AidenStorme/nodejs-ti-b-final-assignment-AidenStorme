const express = require('express');
const Server = require('../models/Server');
const Service = require('../models/Service');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const servers = await Server.find().populate('owner', 'name email');
    res.json(servers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id).populate('owner', 'name email');
    if (!server) {
      return res.status(404).json({ error: 'Server niet gevonden' });
    }
    res.json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const server = await Server.create(req.body);
    res.status(201).json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const server = await Server.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!server) {
      return res.status(404).json({ error: 'Server niet gevonden' });
    }
    res.json(server);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const server = await Server.findByIdAndDelete(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server niet gevonden' });
    }
    res.json({ message: 'Server verwijderd' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/services', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server niet gevonden' });
    }
    const services = await Service.find({ servers: req.params.id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;