const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

require('./setup');

const app = require('../app');
const User = require('../models/User');

beforeEach(async () => {
  await User.deleteMany({});
});

async function registerAndLogin(email) {
  await request(app).post('/api/auth/register').send({
    name: 'Testuser',
    email,
    password: 'geheim123',
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'geheim123' });
  assert.strictEqual(loginRes.status, 200);
  return loginRes.body.token;
}

test('register -> 201, login -> 200 met token', async () => {
  const email = 'happy@test.be';

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Testuser', email, password: 'geheim123' });

  assert.strictEqual(registerRes.status, 201);
  assert.strictEqual(registerRes.body.role, 'user');
  assert.strictEqual(registerRes.body.passwordHash, undefined);

  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'geheim123' });

  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginRes.body.token);
});

test('GET /api/users met admin-token geeft 200 en lijst', async () => {
  const admin = await User.create({
    name: 'Root',
    email: 'root@test.be',
    passwordHash: 'geheim123',
    role: 'admin',
  });
  await registerAndLogin('user@test.be');

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'root@test.be', password: 'geheim123' });
  assert.strictEqual(adminLogin.status, 200);
  const token = adminLogin.body.token;

  const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.strictEqual(res.body.length, 2);
  assert.strictEqual(res.body.some((u) => u._id === admin._id.toString()), true);
});

test('GET /api/users zonder token geeft 401', async () => {
  const res = await request(app).get('/api/users');
  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(res.body, { error: 'Geen token, toegang geweigerd' });
});