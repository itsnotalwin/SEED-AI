/**
 * SEED-0: an ORIGINAL, tiny autoregressive neural language model.
 * 3-character context -> trainable embeddings -> tanh hidden layer -> softmax next character.
 * No downloaded weights, no pretrained model, no model APIs, no dependencies.
 * Educational research prototype. It is NOT a general-purpose LLM.
 */
export const ALPHABET = '\n' + Array.from({length: 95}, (_, i) => String.fromCharCode(i + 32)).join('');
const V = ALPHABET.length;
const CTX = 3;
const EMBED = 8;
const HIDDEN = 48;
const FEATURES = CTX * EMBED;
const END = '\n';
const indexMap = new Map([...ALPHABET].map((c, i) => [c, i]));
const idx = c => indexMap.get(c) ?? indexMap.get(' ');
const normalize = text => Array.from(String(text ?? '').replace(/\r/g, '').normalize('NFKD')).map(c => indexMap.has(c) ? c : ' ').join('');

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
function softmax(logits, temperature = 1) {
  const t = Math.max(.05, temperature);
  const max = Math.max(...logits);
  const out = new Float64Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) { out[i] = Math.exp((logits[i] - max) / t); sum += out[i]; }
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}
function choose(probs, random) { let u = random(); for (let i = 0; i < probs.length; i++) { u -= probs[i]; if (u <= 0) return i; } return probs.length - 1; }

export class SeedModel {
  constructor({ seed = 1337, state } = {}) {
    this.steps = 0;
    this.seed = seed;
    const random = seededRandom(seed);
    const init = (len, scale) => Float32Array.from({ length: len }, () => (random() * 2 - 1) * scale);
    this.embedding = init(V * EMBED, .10);
    this.w1 = init(FEATURES * HIDDEN, .09);
    this.b1 = new Float32Array(HIDDEN);
    this.w2 = init(HIDDEN * V, .07);
    this.b2 = new Float32Array(V);
    if (state) this.load(state);
  }
  static get parameterCount() { return V * EMBED + FEATURES * HIDDEN + HIDDEN + HIDDEN * V + V; }
  forward(chars) {
    const features = new Float64Array(FEATURES);
    const positions = Array.from(chars, idx);
    for (let p = 0; p < CTX; p++) for (let k = 0; k < EMBED; k++) features[p * EMBED + k] = this.embedding[positions[p] * EMBED + k];
    const hidden = new Float64Array(HIDDEN);
    for (let h = 0; h < HIDDEN; h++) {
      let n = this.b1[h];
      for (let j = 0; j < FEATURES; j++) n += features[j] * this.w1[j * HIDDEN + h];
      hidden[h] = Math.tanh(n);
    }
    const logits = new Float64Array(V);
    for (let o = 0; o < V; o++) {
      let n = this.b2[o];
      for (let h = 0; h < HIDDEN; h++) n += hidden[h] * this.w2[h * V + o];
      logits[o] = n;
    }
    return { features, hidden, logits, positions };
  }
  trainOne(context, next, learningRate = .06) {
    const { features, hidden, logits, positions } = this.forward(context);
    const p = softmax(logits);
    const target = idx(next);
    const loss = -Math.log(Math.max(p[target], 1e-12));
    p[target] -= 1; // gradient of cross-entropy w.r.t. logits
    const dHidden = new Float64Array(HIDDEN);
    for (let h = 0; h < HIDDEN; h++) {
      let dh = 0;
      for (let o = 0; o < V; o++) dh += this.w2[h * V + o] * p[o];
      dHidden[h] = dh * (1 - hidden[h] * hidden[h]);
    }
    const dFeatures = new Float64Array(FEATURES);
    for (let j = 0; j < FEATURES; j++) {
      let df = 0;
      for (let h = 0; h < HIDDEN; h++) df += this.w1[j * HIDDEN + h] * dHidden[h];
      dFeatures[j] = df;
    }
    for (let h = 0; h < HIDDEN; h++) for (let o = 0; o < V; o++) this.w2[h * V + o] -= learningRate * hidden[h] * p[o];
    for (let o = 0; o < V; o++) this.b2[o] -= learningRate * p[o];
    for (let j = 0; j < FEATURES; j++) for (let h = 0; h < HIDDEN; h++) this.w1[j * HIDDEN + h] -= learningRate * features[j] * dHidden[h];
    for (let h = 0; h < HIDDEN; h++) this.b1[h] -= learningRate * dHidden[h];
    for (let pos = 0; pos < CTX; pos++) for (let k = 0; k < EMBED; k++) this.embedding[positions[pos] * EMBED + k] -= learningRate * dFeatures[pos * EMBED + k];
    this.steps++;
    return loss;
  }
  *trainingExamples(text) {
    const source = normalize(text);
    let context = '\n'.repeat(CTX);
    for (const c of (source + '\n')) {
      yield [context, c];
      context = context.slice(1) + c;
    }
  }
  train(text, epochs = 1, lr = .05) {
    const examples = [...this.trainingExamples(text)];
    if (examples.length < 2 || examples.length > 25000) throw new Error('Training text must contain 1–24,999 characters.');
    let total = 0;
    for (let ep = 0; ep < epochs; ep++) for (const [context, next] of examples) total += this.trainOne(context, next, lr);
    return total / (examples.length * epochs);
  }
  evaluate(text) {
    const samples = [...this.trainingExamples(text)];
    let loss = 0;
    for (const [context, next] of samples) loss -= Math.log(Math.max(softmax(this.forward(context).logits)[idx(next)], 1e-12));
    return loss / samples.length;
  }
  generate({ prompt = '', maxChars = 180, temperature = .75, seed } = {}) {
    const random = seed == null ? Math.random : seededRandom(seed);
    let context = ('\n'.repeat(CTX) + normalize(prompt)).slice(-CTX);
    let result = '';
    for (let i = 0; i < Math.min(maxChars, 500); i++) {
      const next = ALPHABET[choose(softmax(this.forward(context).logits, temperature), random)];
      if (next === END && result.length > 12) break;
      result += next;
      context = context.slice(1) + next;
    }
    return result.trim();
  }
  export() {
    return { version: 1, architecture: 'seed0-context3-mlp', seed: this.seed, steps: this.steps,
      embedding: [...this.embedding], w1: [...this.w1], b1: [...this.b1], w2: [...this.w2], b2: [...this.b2] };
  }
  load(state) {
    if (state?.version !== 1 || state.architecture !== 'seed0-context3-mlp') throw new Error('Incompatible model state');
    for (const [key, length] of [['embedding', V * EMBED], ['w1', FEATURES * HIDDEN], ['b1', HIDDEN], ['w2', HIDDEN * V], ['b2', V]]) {
      if (!Array.isArray(state[key]) || state[key].length !== length || !state[key].every(Number.isFinite)) throw new Error('Invalid model weights: ' + key);
      this[key] = Float32Array.from(state[key]);
    }
    this.steps = Number.isSafeInteger(state.steps) && state.steps >= 0 ? state.steps : 0;
  }
}

export const modelInfo = Object.freeze({ name: 'SEED-0', parameters: SeedModel.parameterCount, contextChars: CTX, alphabetSize: V, model: 'Original three-character contextual neural language model' });
