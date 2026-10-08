# SEED Evolution Loop — v0

## Long-term objective

SEED is a from-scratch personal AI experiment. The goal is to make it more
useful at modest RAM/compute through experimentally demonstrated improvements.
Hermes or another coding assistant can help write the infrastructure at first,
but SEED's own reproducible tools should eventually own narrow optimization tasks.

**Do not mistake automated parameter search for an AI that understands code.**
SEED-0 is a three-character predictor and cannot plan software development yet.

## Proposed repository responsibilities (only SEED-AI exists today)

| Repository | Visibility | Purpose |
|---|---|---|
| `SEED-AI` | Public | Inference code, UI, tests, public releases |
| `SEED-LAB` | Private | Research queue, experiments, candidate models, evaluations |
| `SEED-BRAIN` | Private | Approved, permitted shared data and knowledge with provenance |

Users' private memories **do not belong** in a shared repository. Keep them
device-local unless individual users explicitly opt into a suitable backend.
Never automatically upload transcripts, credentials or personal memory.

## Hand-off protocol for later cross-repository automation

1. SEED-AI publishes a versioned baseline reference (commit SHA + model format).
2. An authorized event (`repository_dispatch` / `workflow_dispatch`) starts
   a bounded job in SEED-LAB, or a compatible reusable workflow is called.
3. SEED-LAB reads only permitted, versioned data and performs experiments.
4. SEED-LAB stores the experiment manifest and candidate artifact in private
   storage, with checksums, source references, evaluation results, and version.
5. A GitHub App with **least-privilege cross-repository permissions** may create
   a **proposal pull request** to SEED-AI. The default `GITHUB_TOKEN` is not a
   general-purpose cross-repository write token.
6. SEED-AI runs independent correctness, regression, memory, security and
   performance checks, with an untouched held-out test corpus.
7. Only approved proposals land on main and trigger GitHub Pages deployment.
8. Failed or inconclusive experiments remain useful records in the laboratory.

A private repository's reusable workflow cannot be called directly by a public
repository under GitHub's public/private reuse rules. Use a carefully scoped
event/API hand-off when a public-to-private boundary is needed.

## Current first experiment

`node laboratory/evolve.js` tries several bounded learning rates / seeds /
epochs against the **existing** SEED-0 neural network. It chooses using
validation loss, records holdout results separately and produces:
- `laboratory/out/report.json`
- `laboratory/out/candidate-weights.json` (only if a candidate passes)

No generated weights are merged into the app. No code is autonomously altered.
Runs are reproducible with fixed text, seeds and fixed trial configurations.
Tiny demonstration data can cause severe overfitting; this is infrastructure
validation, **not** evidence of new human-like reasoning.

The experiment is scheduled for **Saturday 08:00 South African time** after
the workflow is merged, plus manual triggering. GitHub scheduling can be late.
Each job has a five-minute timeout and a seven-day output-artifact retention.

## The Hermes-to-SEED transition

1. Hermes builds tested experiment tools and source-verification routines.
2. The deterministic harness selects hyperparameters and simple architectures.
3. SEED accumulates **consented, quality-controlled** training data.
4. A more capable SEED model may eventually produce testable code hypotheses.
5. Independent test harnesses evaluate those hypotheses.
6. Hermes becomes optional, but promotion/permissions remain protected by
   automated gates and human review for high-impact changes.

## Guardrails

- No open-ended training on GitHub-hosted runners. Observe limits and policies.
- Do not grant untrusted training data workflows access to write credentials.
- No arbitrary code from public comments, prompts, external sources or
  untrusted pull requests runs with elevated permissions.
- Rate-limit experiments and use short-lived narrowly scoped credentials.
- Do not self-modify workflow/security files or auto-merge generated PRs.
- Never equate a lower loss on one tiny dataset with general capability.
- Keep immutable baselines, holdouts and reproducibility metadata.
