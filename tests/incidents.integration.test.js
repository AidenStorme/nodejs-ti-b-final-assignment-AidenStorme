const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

require('./setup');

const app = require('../app');
const Incident = require('../models/Incident');
const Service = require('../models/Service');
const User = require('../models/User');

beforeEach(async () => {
  await Incident.deleteMany({});
  await Service.deleteMany({});
  await User.deleteMany({});
});

async function registerAndLogin(email) {
  await request(app).post('/api/auth/register').send({
    name: 'Testuser',
    email,
    password: 'geheim123',
  });
  const loginRes = await request(app).post('/api/auth/login').send({
    email,
    password: 'geheim123',
  });
  assert.strictEqual(loginRes.status, 200);
  return loginRes.body;
}

test('POST /api/incidents -> 201, filter ?status=open toont enkel open incidents', async () => {
  const { token, user } = await registerAndLogin('incident@test.be');

  const service = await Service.create({ name: 'srv', image: 'img:latest' });

  const openRes = await request(app)
    .post('/api/incidents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'API traag',
      description: 'Intermitterende 500s',
      severity: 'high',
      affectedService: service._id,
      reportedBy: user._id,
    });
  assert.strictEqual(openRes.status, 201);
  assert.strictEqual(openRes.body.status, 'open');

  const resolvedRes = await request(app)
    .post('/api/incidents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Opgeloste storing',
      description: 'Was al opgelost',
      severity: 'low',
      status: 'resolved',
      affectedService: service._id,
      reportedBy: user._id,
    });
  assert.strictEqual(resolvedRes.status, 201);

  const listRes = await request(app)
    .get('/api/incidents?status=open')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listRes.body));
  assert.strictEqual(listRes.body.length, 1);
  assert.strictEqual(listRes.body[0].status, 'open');
  assert.strictEqual(listRes.body[0].title, 'API traag');
});

test('DELETE /api/incidents/:id als gewone user geeft 403', async () => {
  const { token, user } = await registerAndLogin('incident403@test.be');

  const service = await Service.create({ name: 'srv', image: 'img:latest' });

  const incidentRes = await request(app)
    .post('/api/incidents')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Te verwijderen',
      description: 'Zal niet lukken',
      severity: 'medium',
      affectedService: service._id,
      reportedBy: user._id,
    });
  assert.strictEqual(incidentRes.status, 201);

  const delRes = await request(app)
    .delete(`/api/incidents/${incidentRes.body._id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(delRes.status, 403);
  assert.deepStrictEqual(delRes.body, { error: 'Geen toegang' });
});