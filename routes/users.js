const express = require('express');
const User = require('../models/User');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      passwordHash: req.body.password,
    });
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.status(201).json(safeUser);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    if (req.body.password) {
      user.passwordHash = req.body.password;
    }
    const { password, ...rest } = req.body;
    Object.assign(user, rest);
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.json(safeUser);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    res.json({ message: 'User verwijderd' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;