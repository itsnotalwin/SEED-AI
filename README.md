# SEED AI 🌱 — born from scratch

**An original, tiny neural language-model experiment with portable personal memory.**

No downloaded AI model. No pretrained weights. No OpenAI/OpenRouter calls. No training framework. No external build dependencies.

SEED-0 is not a capable chatbot yet. It is a small, working neural language model written from first principles so we can study, train, measure and gradually improve our own AI system.

## Features

- 3-character input context; learned character embeddings; tanh hidden layer; next-character softmax output.
- Manual backpropagation and stochastic gradient descent implemented in `src/model.js`.
- ~6,000 trainable parameters; randomly initialised on first visit.
- Browser-local training from text supplied by the owner.
- Explicit, editable-through-reteaching question/answer memories separate from neural weights.
- Persistent weights and memories stored locally (`localStorage`), JSON backup import/export, and full reset.
- Minimal black-and-white website deployable to GitHub Pages.
- Self-contained app with zero mandatory runtime dependencies or AI API fees.

## Start now

You can simply serve this directory with any static file server:

```bash
npm run serve
```

On Windows, double-click `start-windows.bat` if Node.js is installed, or run `npm run serve`. Open `http://localhost:4173`. Do not open `index.html` via `file://` because ES modules may be blocked.

Tests:

```bash
npm test
```

## Deploy to GitHub Pages

1. Create a **public** GitHub repository called `seed-ai` (or another name).
2. Upload the contents of this directory to the default `main` branch.
3. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Push another commit or start the workflow manually, then check **Actions** for the deployed URL.

Deployment requires the connected GitHub account to have permissions to configure Pages.

## Limitations

- SEED-0 is a learning demonstration, not a replacement for a modern pretrained language model. A 3-character context cannot follow complex instructions or construct working HTML reliably.
- The useful conversation interface currently recalls explicitly taught examples using lexical overlap. Unknown queries are honestly reported as unknown.
- The neural generator produces experimental character sequences, usually poor quality unless trained on plenty of text.
- No model training from random weights happens automatically on every user message. That would incorrectly turn every utterance into asserted ground truth.
- Data remains in a browser's origin-local storage, which may be cleared by users or browsers. **Export backups.**
- The app makes no network requests for model inference or fonts; all logic and styles are local.
- There is no cross-user learning, cloud synchronisation or model fine-tuning service yet.

## Long-term direction

Build a small, personal AI whose **brain is durable while the model is replaceable**. Future experiments: tokenisation, attention/context models, efficient optimisers, opt-in data collection, independently evaluated training, and optional more capable inference on available hardware.

## Architecture

- `src/model.js`: original neural network and training/inference.
- `src/brain.js`: memories, examples, data persistence/export.
- `src/app.js`: frontend event handlers and rendering.
- `docs/architecture.md`: detailed roadmap and boundaries.

MIT licensed.
