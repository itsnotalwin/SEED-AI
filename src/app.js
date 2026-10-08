import { Brain } from './brain.js';
import { modelInfo } from './model.js';
const brain = new Brain();
const $ = id => document.getElementById(id);
const messages = $('messages');
let activeView = 'chat';
const escapeStatus = text => { $('status').textContent = text; };
function view(name) {
  activeView = name;
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('hidden', v.id !== `${name}-view`));
  $('currentView').textContent = name === 'chat' ? 'CONVERSATION' : name.toUpperCase();
  if (name === 'memory') renderBrain();
}
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => view(button.dataset.view)));
function appendMessage(who, text, note = '') {
  $('intro').classList.add('hidden');
  const article = document.createElement('article');
  article.className = `message ${who}`;
  const label = document.createElement('div'); label.className = 'message-label'; label.textContent = who === 'you' ? 'YOU' : 'SEED / ' + note.toUpperCase();
  const body = document.createElement('div'); body.className = 'message-body'; body.textContent = text;
  article.append(label, body); messages.append(article);
  messages.scrollTop = messages.scrollHeight;
}
$('chatForm').addEventListener('submit', e => {
  e.preventDefault(); const value = $('prompt').value.trim(); if (!value) return;
  $('prompt').value = ''; appendMessage('you', value);
  const response = brain.respond(value);
  appendMessage('seed', response.text, response.method);
});
$('prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('chatForm').requestSubmit(); } });
$('teachForm').addEventListener('submit', e => {
  e.preventDefault();
  try { brain.teach($('question').value, $('answer').value); $('teachForm').reset(); escapeStatus('Example learned. Ask the same question in Conversation to check recall.'); }
  catch (err) { escapeStatus(err.message); }
});
$('epochs').addEventListener('input', () => $('epochCount').textContent = $('epochs').value);
$('trainForm').addEventListener('submit', async e => {
  e.preventDefault();
  const text = $('corpus').value; const epochs = Number($('epochs').value);
  const button = $('trainButton'); button.disabled = true; escapeStatus('Training SEED-0 locally. Your browser may briefly work harder.');
  // Allow status to paint before CPU training begins.
  await new Promise(resolve => setTimeout(resolve, 30));
  try { const before = brain.model.evaluate(text); const after = brain.train(text, epochs); escapeStatus(`Training finished. Loss before: ${before.toFixed(3)} · mean training loss: ${after.toFixed(3)} · current: ${brain.model.evaluate(text).toFixed(3)} · updates: ${brain.model.steps.toLocaleString()}`); }
  catch (err) { escapeStatus(err.message); }
  finally { button.disabled = false; }
});
$('generate').addEventListener('click', () => {
  const text = brain.model.generate({ prompt: $('starter').value, maxChars: 220, temperature: .65 });
  $('generated').textContent = text || 'No generated characters. Add training text and try again.';
});
$('factForm').addEventListener('submit', e => {
  e.preventDefault();
  try { brain.addFact($('factLabel').value, $('factContent').value); $('factForm').reset(); renderBrain(); }
  catch (err) { window.alert(err.message); }
});
function renderBrain() {
  $('examplesCount').textContent = String(brain.data.examples.length);
  $('factsCount').textContent = String(brain.data.facts.length);
  $('stepsCount').textContent = brain.model.steps.toLocaleString();
  const container = $('memoryList'); container.replaceChildren();
  const items = [
    ...brain.data.facts.map(f => ({ type: 'MEMORY', label: f.label, value: f.content })),
    ...brain.data.examples.map(e => ({ type: 'LEARNED ANSWER', label: e.question, value: e.answer }))
  ];
  if (!items.length) { const p = document.createElement('p'); p.className = 'empty-list'; p.textContent = 'Nothing stored yet. Teach SEED its first fact or answer.'; container.append(p); return; }
  for (const item of items.slice(-100).reverse()) {
    const box = document.createElement('div'); box.className = 'memory-item';
    const small = document.createElement('span'); small.className = 'card-index'; small.textContent = item.type;
    const title = document.createElement('strong'); title.textContent = item.label;
    const desc = document.createElement('p'); desc.textContent = item.value;
    box.append(small,title,desc); container.append(box);
  }
}
$('export').addEventListener('click', () => {
  const blob = new Blob([brain.export()], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'seed-brain-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('import').addEventListener('change', async e => {
  const f = e.target.files?.[0]; if (!f) return;
  if (f.size > 2_000_000) { window.alert('File exceeds 2 MB prototype import limit.'); return; }
  try {
    const data = JSON.parse(await f.text());
    if (!confirm('Replace this device’s existing SEED brain with the imported data? Export a backup first.')) return;
    brain.import(data); renderBrain(); window.alert('Brain imported.');
  } catch (err) { window.alert('Import failed: '+err.message); }
  e.target.value = '';
});
$('forget').addEventListener('click', () => {
  if (confirm('Erase all locally learned examples, facts and neural weights? This cannot be undone without a backup.')) {
    brain.forget(); messages.replaceChildren(); $('intro').classList.remove('hidden'); renderBrain();
  }
});
$('paramCount').textContent = `${modelInfo.parameters.toLocaleString()} parameters`;
renderBrain();
