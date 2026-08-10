const express = require('express');
const User = require('../models/User');
const validateObjectId = require('../middleware/validateObjectId');
const asyncHandler = require('../middleware/asyncHandler');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * Toegangsmatrix — routes/users.js
 *
 * | Endpoint    | Gast | User            | Admin |
 * |-------------|------|-----------------|-------|
 * | GET /       |  -   |  -              |  ja   |
 * | GET /:id    |  -   |  -              |  ja   |
 * | POST /      |  -   |  -              |  ja   |
 * | PUT /:id    |  -   |  ja (eigen id)  |  ja   |
 * | DELETE /:id |  -   |  -              |  ja   |
 *
 * register/login (routes/auth.js) blijven publiek.
 */

const router = express.Router();

router.get(
  '/',
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  })
);

router.get(
  '/:id',
  validateObjectId,
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    res.json(user);
  })
);

router.post(
  '/',
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      passwordHash: req.body.password,
      role: req.body.role || 'user',
    });
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.status(201).json(safeUser);
  })
);

router.put(
  '/:id',
  validateObjectId,
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Geen toegang' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    if (req.user.role === 'admin') {
      // Admin mag alle velden wijzigen (rechten toekennen is admin-only, geen escalatie).
      if (req.body.password) {
        user.passwordHash = req.body.password;
      }
      const { password, ...rest } = req.body;
      Object.assign(user, rest);
    } else {
      // Eigen profiel: whitelist enkel name, email en password.
      // Keuze: een meestuurd role-veld wordt stil genegeerd (geen foutmelding),
      // zodat escalatie-pogingen geen response-verschil opleveren.
      if (typeof req.body.name === 'string') user.name = req.body.name;
      if (typeof req.body.email === 'string') user.email = req.body.email;
      if (req.body.password) user.passwordHash = req.body.password;
    }
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.json(safeUser);
  })
);

router.delete(
  '/:id',
  validateObjectId,
  auth,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User niet gevonden' });
    }
    res.json({ message: 'User verwijderd' });
  })
);

module.exports = router;