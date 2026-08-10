const { test } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const Server = require("../models/Server");

function makeServer(ip) {
  return new Server({
    hostname: "px1",
    ip,
    os: "Ubuntu 24.04",
    cpuCores: 4,
    ramGB: 16,
    storageGB: 500,
    owner: new mongoose.Types.ObjectId(),
  });
}

test("ip 300.1.1.1 is ongeldig (octet > 255)", () => {
  const err = makeServer("300.1.1.1").validateSync();
  assert.ok(err);
  assert.ok(err.errors.ip);
});

test("ip 01.1.1.1 is ongeldig (leading zero)", () => {
  const err = makeServer("01.1.1.1").validateSync();
  assert.ok(err);
  assert.ok(err.errors.ip);
});

test("ip 192.168.1.1 is geldig", () => {
  const server = makeServer("192.168.1.1");
  assert.strictEqual(server.validateSync(), undefined);
});
