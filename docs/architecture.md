# SEED research plan

## What is SEED-0?

A real trainable neural next-character predictor. It uses a 3-character context, learned 8-dimensional embeddings, a 48-unit tanh hidden layer and a 96-symbol softmax output. Its weights start from seeded pseudo-random numbers; it learns from user-supplied text using manual gradient descent. The entire model is ~6.6k scalar weights and biases.

This is intentionally a limited scientific baseline, **not** a functioning general assistant.

## Why start this small?

We have no dedicated GPUs or training cluster. The first goal is to own, understand, instrument, and validate the full machine-learning loop: data -> loss -> gradient -> weight update -> generation -> persistence. From this baseline we can test architecture changes honestly.

## Memory is separate from intelligence

`Brain` stores explicit teaching pairs and facts. The conversation interface retrieves similar items with a lightweight overlap score. It doesn't claim these pairs update the neural network's ability to reason. The Train screen **does** change neural weights; output remains limited due to context/model size and dataset constraints.

## Roadmap

1. Establish reproducible baselines on weak hardware (correctness, accuracy, memory, speed).
2. Improve tokenisation and training data. Add a privacy-conscious, opt-in dataset pipeline.
3. Build longer-context model variants, test under identical data budgets.
4. Improve retrieval of past memories independently of generation.
5. Investigate attention, quantisation, distillation, and simple tool interfaces. Do not claim gains without benchmarks.
6. Train only on licensed/consented high-quality data; carefully split evaluation/test sets.
7. Consider community-driven knowledge contributions and training only with explicit opt-in and robust review.
8. Any self-improving code system must propose reviewed changes rather than auto-edit protections.

## GitHub/data boundaries

Public app repo: source code, unit tests, workflow and docs. Never publish users' training corpora or private memory. Later: a separate research repo for curated experimental findings. Individual brains remain local or in properly secured user-specific storage.

## Security/privacy

No model APIs or server-side execution. No arbitrary code execution. User strings inserted with `textContent`. Imported model weight arrays validated before use. Users own exports. Browser storage is not encrypted at rest, so users should not store secrets or sensitive information in this prototype.
