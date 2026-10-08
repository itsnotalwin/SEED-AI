# SEED AI — Agent instructions

This is an ORIGINAL experimental neural network written in JavaScript. Do not replace it with an API wrapper or pretend it is capable of general conversation.

## Requirements
- Prefer no build dependencies and low RAM/CPU usage.
- `src/model.js` defines SEED-0. Weights start randomly; forward pass and backpropagation are in-source.
- `src/brain.js` holds user-owned local memories; keep it isolated from the neural model.
- Never upload conversation, training examples, or memories without explicit opt-in.
- Keep all user-generated text rendered as text, not HTML.
- Do not add unsafe eval or arbitrary script execution.
- Any new model architecture needs reproducible tests, baseline comparison, and size/runtime metrics.
- Never claim that SEED-0 understands language or is a practical LLM.
- Do not self-modify application code or automatically publish user-generated code.
- Before committing, run `npm test` and review privacy-sensitive changes.
