const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

require("./setup");

const app = require("../app");
const Service = require("../models/Service");
const Server = require("../models/Server");
const User = require("../models/User");

beforeEach(async () => {
  await Service.deleteMany({});
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

test("POST /api/services -> 201, GET /:id -> 200 met servers gepopulated", async () => {
  const { token, user } = await registerAndLogin("service@test.be");

  const serverRes = await request(app)
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
  assert.strictEqual(serverRes.status, 201);

  const postRes = await request(app)
    .post("/api/services")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "nginx",
      image: "nginx:1.25",
      internalPort: 80,
      servers: [serverRes.body._id],
    });
  assert.strictEqual(postRes.status, 201);
  assert.strictEqual(postRes.body.servers[0], serverRes.body._id);

  const getRes = await request(app)
    .get(`/api/services/${postRes.body._id}`)
    .set("Authorization", `Bearer ${token}`);
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.name, "nginx");
  assert.ok(Array.isArray(getRes.body.servers));
  assert.strictEqual(getRes.body.servers[0].hostname, "px1");
});

test("PUT /api/services/:id door niet-owner geeft 403", async () => {
  const { token: ownerToken, user } = await registerAndLogin("owner@test.be");
  const { token: strangerToken } = await registerAndLogin("stranger@test.be");

  const serverRes = await request(app)
    .post("/api/servers")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      hostname: "px-owner",
      ip: "10.0.0.9",
      os: "Ubuntu 24.04",
      cpuCores: 2,
      ramGB: 8,
      storageGB: 100,
      owner: user._id,
    });

  const serviceRes = await request(app)
    .post("/api/services")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({ name: "web", image: "web:latest", servers: [serverRes.body._id] });
  assert.strictEqual(serviceRes.status, 201);

  const putRes = await request(app)
    .put(`/api/services/${serviceRes.body._id}`)
    .set("Authorization", `Bearer ${strangerToken}`)
    .send({ replicas: 5 });

  assert.strictEqual(putRes.status, 403);
  assert.deepStrictEqual(putRes.body, { error: "Geen toegang" });
});
