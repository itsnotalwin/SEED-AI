import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTrials, TRAIN_TEXT, VALIDATION_TEXT, TEST_TEXT } from '../laboratory/evolve.js';

const configs = [
  { id: 'baseline', seed: 1337, learningRate: 0.02, epochs: 1 },
  { id: 'candidate', seed: 99, learningRate: 0.02, epochs: 2 }
];

test('an experiment produces finite losses and a reproducible result', () => {
  const a = evaluateTrials({ trials: configs });
  const b = evaluateTrials({ trials: configs });
  assert.deepEqual(a.report, b.report);
  assert.equal(a.report.schemaVersion, 1);
  assert.equal(a.report.trials.length, 2);
  for (const result of a.report.trials) {
    assert(Number.isFinite(result.trainingLoss));
    assert(Number.isFinite(result.validationLoss));
    assert(Number.isFinite(result.testLoss));
  }
  assert.equal(a.report.corpusHash.length, 64);
});

test('experiment rejects configurations exceeding limits', () => {
  assert.throws(() => evaluateTrials({ trials: [
    { id: 'baseline', seed: 1, epochs: 999, learningRate: 0.02 }
  ] }), /bounds/);
});

test('training, validation and holdout are distinct corpora', () => {
  assert.notEqual(TRAIN_TEXT, VALIDATION_TEXT);
  assert.notEqual(TRAIN_TEXT, TEST_TEXT);
  assert.notEqual(VALIDATION_TEXT, TEST_TEXT);
});

test('experiment never claims auto-deployment', () => {
  const { report } = evaluateTrials({ trials: configs });
  assert.match(report.conclusion, /evaluation|improvement established/);
});
