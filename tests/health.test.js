const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

require('./setup');

const app = require('../app');

test('GET /api/health geeft 200', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'ok' });
});