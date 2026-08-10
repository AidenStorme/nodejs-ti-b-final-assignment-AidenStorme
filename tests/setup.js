const mongoose = require('mongoose');
const { before, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('eindwerk_test');
  await mongoose.connect(process.env.MONGO_URI);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

module.exports = { getUri: () => mongod && mongod.getUri('eindwerk_test') };