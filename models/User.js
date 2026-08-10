const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2 },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["guest", "user", "admin"], default: "user" },
});

userSchema.pre("save", async function () {
  if (this.isModified("passwordHash")) {
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
  }
});

module.exports = mongoose.model("User", userSchema);
