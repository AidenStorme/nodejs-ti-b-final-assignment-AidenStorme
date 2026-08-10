const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const auth = require("../middleware/auth");

const router = express.Router();

router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
);

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email en password zijn verplicht" });
    }
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: "user",
    });
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.status(201).json(safeUser);
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email en password zijn verplicht" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Ongeldige email of wachtwoord" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Ongeldige email of wachtwoord" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    res.json({ token, user: safeUser });
  }),
);

module.exports = router;
