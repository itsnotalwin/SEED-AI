/**
 * SEED Evolution Lab v0
 *
 * A bounded and reproducible hyperparameter search over our EXISTING tiny
 * neural network. No LLM services, no remote data, no auto-deployment.
 *
 * This is engineering search, not autonomous scientific reasoning.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SeedModel } from '../src/model.js';

export const TRAIN_TEXT = [
  'seed is a small machine that learns from short sentences.',
  'a memory can help a little model remember useful facts.',
  'the little machine reads words and predicts the next character.',
  'a careful experiment compares a new model with an older model.',
  'better results must be tested before a model can be upgraded.',
  'the moon is bright and the sky is quiet tonight.',
  'we learn by testing ideas and correcting mistakes.'
].join('\n') + '\n';

export const VALIDATION_TEXT = [
  'a small model learns by reading examples.',
  'we test the machine before making changes.'
].join('\n') + '\n';

export const TEST_TEXT = [
  'careful tests help us find useful improvements.',
  'a memory is not the same as a trained model.'
].join('\n') + '\n';

export const TRIALS = Object.freeze([
  { id: 'baseline', seed: 1337, learningRate: 0.02, epochs: 1 },
  { id: 'longer-training', seed: 1337, learningRate: 0.02, epochs: 2 },
  { id: 'slower-rate', seed: 19, learningRate: 0.01, epochs: 3 },
  { id: 'faster-rate', seed: 23, learningRate: 0.03, epochs: 2 }
]);

export function evaluateTrials({
  trainText = TRAIN_TEXT,
  validationText = VALIDATION_TEXT,
  testText = TEST_TEXT,
  trials = TRIALS
} = {}) {
  if (!Array.isArray(trials) || !trials.length || trials[0].id !== 'baseline') {
    throw new Error('A baseline trial is required in first position.');
  }
  const candidates = [];
  const results = [];
  for (const trial of trials) {
    if (!Number.isInteger(trial.epochs) || trial.epochs < 1 || trial.epochs > 3
        || !Number.isFinite(trial.learningRate) || trial.learningRate <= 0 || trial.learningRate > 0.05
        || !Number.isSafeInteger(trial.seed)) {
      throw new Error('Trial exceeds the permitted experiment bounds.');
    }
    const model = new SeedModel({ seed: trial.seed });
    const trainingLoss = model.train(trainText, trial.epochs, trial.learningRate);
    const validationLoss = model.evaluate(validationText);
    // The holdout is reported, never used to select the winner.
    const testLoss = model.evaluate(testText);
    if (![trainingLoss, validationLoss, testLoss].every(Number.isFinite)) {
      throw new Error('Non-finite training or evaluation result.');
    }
    results.push({
      ...trial, trainingLoss, validationLoss, testLoss,
      parameterCount: SeedModel.parameterCount
    });
    candidates.push(model);
  }
  let bestIndex = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i].validationLoss < results[bestIndex].validationLoss) bestIndex = i;
  }
  const baseline = results[0];
  const best = results[bestIndex];
  const candidatePasses = bestIndex !== 0
    && best.validationLoss < baseline.validationLoss - 0.015
    && best.testLoss < baseline.testLoss;
  const report = {
    schemaVersion: 1,
    objective: 'Reduce held-out character prediction loss on SEED-0 using bounded parameter searches.',
    corpusHash: createHash('sha256').update(trainText + '\0' + validationText + '\0' + testText).digest('hex'),
    criterion: 'Validation loss selects the candidate; holdout test loss is a separate regression check.',
    baselineId: baseline.id,
    bestValidationId: best.id,
    candidatePasses,
    conclusion: candidatePasses ? 'Promising trial; requires more independent evaluation before release.' : 'No validated improvement established.',
    trials: results,
    note: 'Tiny datasets can mislead. This does not prove general language ability or justify automatic deployment.'
  };
  return { report, candidateWeights: candidatePasses ? candidates[bestIndex].export() : null };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const { report, candidateWeights } = evaluateTrials();
  const outputDirectory = resolve('laboratory/out');
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  if (candidateWeights) {
    writeFileSync(resolve(outputDirectory, 'candidate-weights.json'), JSON.stringify(candidateWeights) + '\n');
  }
  console.log(JSON.stringify({
    best: report.bestValidationId,
    passes: report.candidatePasses,
    summary: report.conclusion,
    results: report.trials.map(({ id, validationLoss, testLoss }) => ({ id, validationLoss, testLoss }))
  }, null, 2));
}