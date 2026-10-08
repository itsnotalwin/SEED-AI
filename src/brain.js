/** Personal, device-local learning store. Explicitly taught examples only. */
import { SeedModel } from './model.js';
const KEY = 'seed-ai-brain-v1';
const empty = () => ({ version: 1, createdAt: new Date().toISOString(), name: 'SEED', examples: [], facts: [], history: [], model: null });
const clean = s => String(s ?? '').trim().slice(0, 2000);
const terms = s => new Set(clean(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
function overlap(a, b) {
  const x = terms(a), y = terms(b);
  if (!x.size || !y.size) return 0;
  let n = 0; for (const v of x) if (y.has(v)) n++;
  return (2 * n) / (x.size + y.size);
}
export class Brain {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = empty();
    try { const raw = storage.getItem(KEY); if (raw) this.import(JSON.parse(raw), false); } catch { this.data = empty(); }
    this.model = new SeedModel({ state: this.data.model ?? undefined });
  }
  save() {
    this.data.model = this.model.export();
    this.storage.setItem(KEY, JSON.stringify(this.data));
  }
  teach(question, answer) {
    question = clean(question); answer = clean(answer);
    if (!question || !answer) throw new Error('Both question and answer are required.');
    if (this.data.examples.length >= 500) throw new Error('Maximum of 500 examples for this prototype.');
    const existing = this.data.examples.find(e => e.question.toLowerCase() === question.toLowerCase());
    if (existing) { existing.answer = answer; existing.updatedAt = new Date().toISOString(); }
    else this.data.examples.push({ question, answer, createdAt: new Date().toISOString() });
    this.save();
  }
  addFact(label, content) {
    label = clean(label); content = clean(content);
    if (!label || !content) throw new Error('Memory label and content are required.');
    this.data.facts = this.data.facts.filter(f => f.label.toLowerCase() !== label.toLowerCase());
    this.data.facts.push({ label, content, createdAt: new Date().toISOString() });
    this.save();
  }
  respond(question) {
    const q = clean(question);
    if (!q) return { text: 'Type a question to begin.', method: 'system' };
    const candidates = [
      ...this.data.examples.map(e => ({ input: e.question, answer: e.answer, type: 'learned example' })),
      ...this.data.facts.map(f => ({ input: f.label, answer: f.content, type: 'personal memory' }))
    ];
    const ranked = candidates.map(e => ({ ...e, score: overlap(q, e.input) })).sort((a,b) => b.score-a.score);
    if (ranked[0] && ranked[0].score >= .57) return { text: ranked[0].answer, method: ranked[0].type, score: ranked[0].score };
    return { text: 'I don’t know that yet. Teach me an answer in the Learn tab, or train my tiny neural model with sample text. My neural generator is experimental and cannot reliably answer general questions.', method: 'unknown' };
  }
  train(text, epochs = 2) {
    const loss = this.model.train(text, epochs);
    this.data.history.push({ when: new Date().toISOString(), chars: text.length, epochs, loss });
    this.data.history = this.data.history.slice(-50);
    this.save();
    return loss;
  }
  export() { return JSON.stringify({ ...this.data, model: this.model.export() }, null, 2); }
  import(data, persist = true) {
    if (data?.version !== 1 || !Array.isArray(data.examples) || !Array.isArray(data.facts) || !Array.isArray(data.history)) throw new Error('Invalid SEED brain file');
    if (data.examples.length > 500 || data.facts.length > 1000) throw new Error('Imported brain exceeds prototype limits');
    if (data.model) new SeedModel({ state: data.model });
    this.data = { ...empty(), ...data, examples: data.examples, facts: data.facts, history: data.history };
    if (persist) { this.model = new SeedModel({ state: data.model ?? undefined }); this.save(); }
  }
  forget() { this.data = empty(); this.model = new SeedModel(); this.save(); }
}
