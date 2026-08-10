const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

require("./setup");

const app = require("../app");
const Server = require("../models/Server");
const User = require("../models/User");

beforeEach(async () => {
  await Server.deleteMany({});
  await User.deleteMany({});
});

async function registerAndLogin(email) {
  await request(app).post("/api/auth/register").send({
    name: "Testuser",
    email,
    password: "geheim123",
  });
  const loginRes = await request(app).post("/api/auth/login").send({
    email,
    password: "geheim123",
  });
  assert.strictEqual(loginRes.status, 200);
  return loginRes.body;
}

test("POST /api/servers -> 201, GET /:id -> 200 met de data", async () => {
  const { token, user } = await registerAndLogin("server@test.be");

  const postRes = await request(app)
    .post("/api/servers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      hostname: "px1",
      ip: "10.0.0.5",
      os: "Ubuntu 24.04",
      cpuCores: 4,
      ramGB: 16,
      storageGB: 500,
      owner: user._id,
    });

  assert.strictEqual(postRes.status, 201);
  assert.strictEqual(postRes.body.hostname, "px1");

  const getRes = await request(app)
    .get(`/api/servers/${postRes.body._id}`)
    .set("Authorization", `Bearer ${token}`);

  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.hostname, "px1");
  assert.strictEqual(getRes.body.ip, "10.0.0.5");
  assert.strictEqual(getRes.body.cpuCores, 4);
});

test("GET /api/servers/:id met niet-bestaand maar geldig ID geeft 404", async () => {
  const { token } = await registerAndLogin("server404@test.be");
  const res = await request(app)
    .get("/api/servers/6404e4b2a1b2c3d4e5f6a7b8")
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(res.status, 404);
});

test("GET /api/servers/:id met ongeldig ID-formaat geeft 400", async () => {
  const { token } = await registerAndLogin("server400@test.be");
  const res = await request(app)
    .get("/api/servers/niets-geldig")
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(res.status, 400);
  assert.deepStrictEqual(res.body, { error: "Ongeldig ID formaat" });
});

test("POST /api/servers met vervalste owner in body krijgt eigen user als owner", async () => {
  const { token, user } = await registerAndLogin("serverOwnerA@test.be");
  const otherUser = await User.create({
    name: "Andere",
    email: "serverOwnerB@test.be",
    passwordHash: "geheim123",
    role: "user",
  });

  const postRes = await request(app)
    .post("/api/servers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      hostname: "fakeserver",
      ip: "10.0.0.9",
      os: "Debian 12",
      cpuCores: 2,
      ramGB: 8,
      storageGB: 250,
      owner: otherUser._id,
    });

  assert.strictEqual(postRes.status, 201);
  assert.strictEqual(postRes.body.owner, user._id);

  const server = await Server.findById(postRes.body._id);
  assert.strictEqual(server.owner.toString(), user._id);
});
