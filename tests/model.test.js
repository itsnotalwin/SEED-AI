import test from 'node:test';
import assert from 'node:assert/strict';
import { SeedModel, modelInfo } from '../src/model.js';
import { Brain } from '../src/brain.js';

test('model is genuinely small and starts untrained', () => {
  const m = new SeedModel();
  assert.ok(modelInfo.parameters < 10000);
  assert.equal(m.steps, 0);
  assert.equal(m.export().architecture, 'seed0-context3-mlp');
});
test('backpropagation lowers loss on repeated text', () => {
  const m = new SeedModel({seed: 7});
  const text = 'abababababababababababababababab';
  const before = m.evaluate(text);
  for (let i=0; i<15; i++) m.train(text, 1, .04);
  const after = m.evaluate(text);
  assert.ok(after < before * .6, `expected loss to fall: ${before} -> ${after}`);
});
test('export/import preserves neural predictions', () => {
  const m = new SeedModel(); m.train('tiny original neural model',2);
  const imported = new SeedModel({state:m.export()});
  assert.equal(m.generate({prompt:'tiny', seed:17}), imported.generate({prompt:'tiny',seed:17}));
});
test('personal memory is persistent and independently retrievable', () => {
  const data = new Map();
  const store = {setItem:(k,v)=>data.set(k,v), getItem:k=>data.get(k) ?? null};
  const a = new Brain(store);
  a.teach('What is my favourite colour?', 'Black and white.');
  a.addFact('My camera', 'Canon EOS 4000D');
  const b = new Brain(store);
  assert.equal(b.respond('What is my favourite colour?').text, 'Black and white.');
  assert.equal(b.respond('My camera').text, 'Canon EOS 4000D');
  assert.equal(b.respond('Who invented teleportation?').method, 'unknown');
  b.forget();
  assert.equal(new Brain(store).data.examples.length,0);
});
test('model import rejects malformed shapes', () => {
  const state = new SeedModel().export(); state.embedding.pop();
  assert.throws(() => new SeedModel({state}),/Invalid model/);
});
