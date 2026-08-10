const { test } = require('node:test');
const assert = require('node:assert');
const validateObjectId = require('../middleware/validateObjectId');

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

test('validateObjectId: ongeldig ID geeft 400', () => {
  const res = mockRes();
  let nextCalled = false;
  validateObjectId({ params: { id: 'niets-geldig' } }, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.code, 400);
  assert.deepStrictEqual(res.body, { error: 'Ongeldig ID formaat' });
});

test('validateObjectId: geldig ID (24 hex) roept next() aan', () => {
  const res = mockRes();
  let nextCalled = false;
  validateObjectId({ params: { id: '6404e4b2a1b2c3d4e5f6a7b8' } }, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.code, undefined);
});