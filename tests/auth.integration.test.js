const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

require("./setup");

const app = require("../app");
const User = require("../models/User");

beforeEach(async () => {
  await User.deleteMany({});
});

test("login met fout wachtwoord en met niet-bestaand email geven dezelfde 401-melding", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Aiden", email: "aiden@test.be", password: "geheim123" });

  const wrongPassword = await request(app)
    .post("/api/auth/login")
    .send({ email: "aiden@test.be", password: "fout-wachtwoord" });
  assert.strictEqual(wrongPassword.status, 401);

  const unknownEmail = await request(app)
    .post("/api/auth/login")
    .send({ email: "bestaat-niet@test.be", password: "geheim123" });
  assert.strictEqual(unknownEmail.status, 401);

  assert.deepStrictEqual(wrongPassword.body, unknownEmail.body);
});

test("GET /api/auth/me zonder token geeft 401", async () => {
  const res = await request(app).get("/api/auth/me");
  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(res.body, { error: "Geen token, toegang geweigerd" });
});
