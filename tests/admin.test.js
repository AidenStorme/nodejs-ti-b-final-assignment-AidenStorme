const { test } = require('node:test');
const assert = require('node:assert');
const admin = require('../middleware/admin');

function mockRes() {
  return {
    code: undefined,
    body: undefined,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('admin: gewone user krijgt 403', () => {
  const res = mockRes();
  let nextCalled = false;
  admin({ user: { role: 'user' } }, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.code, 403);
  assert.deepStrictEqual(res.body, { error: 'Geen toegang' });
});

test('admin: guest krijgt 403', () => {
  const res = mockRes();
  let nextCalled = false;
  admin({ user: { role: 'guest' } }, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.code, 403);
});

test('admin: admin roept next() aan zonder response', () => {
  const res = mockRes();
  let nextCalled = false;
  admin({ user: { role: 'admin' } }, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.code, undefined);
});