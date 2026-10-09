# SEED OBSERVATORY — V1 DESIGN BRIEF
## A public, honest window into an AI trained from scratch

**Status:** Design specification only. This branch makes no website, model, data, or deployment changes.

### Objective
Evolve the current SEED AI website into a polished, minimalist **black-and-white scientific observatory** where visitors can follow the development of the SEED language model: architecture experiments, learning curves, real checkpoints, measurable improvements, failures, and the growing research archive. The goal remains **one evolving SEED**, with multiple candidate brains tested in SEED-LAB. The site is not a competition-themed videogame or a fake consciousness dashboard.

### Existing site assessment
Current `index.html` includes Conversation, Teach & Train, Brain & Memory, and About SEED. Vanilla JS in `src/app.js` and the local model/memory in `src/model.js` and `src/brain.js` are functional and should be preserved as separate surfaces. Existing `src/style.css` has muted green and warm neutrals. The Observatory aesthetic should remove green entirely and modernise the visual hierarchy, while maintaining the model's local privacy.

### Visual direction
- **Strict grayscale**: #FFFFFF primary canvas; #101010 ink/sidebar; #707070 secondary text; #E5E5E5 borders; #F5F5F5 recessed surfaces. No green, neon, coloured success badges, gradients, or decorative 3D brains.
- **Editorial typography**: a crisp sans-serif for headlines and paragraphs; a mono typeface for experiment IDs, commits, metrics, dates and axes. Readable system fallbacks; no font-file distribution. Large 68–104px landing title on desktop, responsive 44px on mobile.
- **Precision layout**: airy 12-column CSS grid, thin one-pixel rules, restrained compact navigation, generous whitespace, clear labels, and a deliberate mix of large typographic statements with small factual annotations.
- **Identity**: typographic SEED wordmark with one simple symbolic mark; avoid human faces or misleading anthropomorphic visualisations.
- **Motion**: quiet transitions 150–300ms, reduced-motion support. If replay is shown, controls explicitly indicate that it is a *recorded checkpoint replay*, not live learning.
- **Accessibility**: 4.5:1 text contrast, keyboard-first tabs/menus, labelled axes, focus outlines, responsive accessible tables, text equivalents for charts, no reliance on colour.

### Proposed navigation
1. **Overview** — SEED's current *verified* capabilities, version, experiment totals, last verified training, and an honest statement of limitations.
2. **Evolution** — scrollable, filterable architecture family tree. Only actual trained and persisted models appear as solid nodes. Unbuilt concepts are dashed and explicitly labelled `PROPOSED`.
3. **Arena** — tables and charts comparing architecture families with dataset, hardware and compute filters; prevent comparisons from mixing incompatible experiments.
4. **Learning** — real training curves and recorded outputs at saved checkpoints. Untrained models display blank states, not synthetic predictions.
5. **Research** — dated, sourced laboratory notes, experiment hypotheses, pass/fail outcomes and reproducibility details.
6. **Interact** — preserve SEED-0 conversational demo and local `Teach & Train` features, clearly distinct from scientific benchmarking.
7. **My Memory** — local-device memories, export/import and deletion; these never appear in public Observatory data.

### Homepage anatomy (desktop)
**Navigation:** restrained monochrome sidebar on wide screens, collapsible top navigation on mobile.
**Hero:** small overline `SEED / DEVELOPMENT OBSERVATORY`; massive heading `AN INTELLIGENCE / IN PROGRESS.`; two concise lines explaining SEED is trained from scratch and monitored with reproducible experiments; link to the current model.
**At-a-glance row:** `VERIFIED MODEL` / `RUNS COMPLETED` / `BEST VALIDATION BPC` / `LATEST EXPERIMENT`; derived from actual published data; empty metrics render `NOT YET MEASURED`, not zeros or guesses.
**Evolution strip:** horizontal/vertical timeline from SEED-0 to explicitly labelled proposed families. Hover/focus reveals params, context, and training status.
**Learning graph:** actual validation BPC vs tokens processed with honest dataset/seed information. Never interpolate fictional improvements across architectures.
**Lab notebook:** dated research entries with one-line hypothesis, outcome, method, and source commit.
**Footer:** links to public SEED-AI, description of private SEED-LAB/BRAIN boundaries (no private links required), dataset licence summary, and a methodology explainer.

### Detailed screen behaviour
- **Model detail:** exact architecture specification, parameter count derived from model implementation, evidence label, hardware, trained data version, checkpoint hashes, metrics, and identical generation-prompt comparisons across versions.
- **Compare two models:** choose two independently evaluated candidates *only if* dataset and evaluation protocol are compatible; otherwise show a plain-language warning and split comparisons by experiment.
- **Learning replay:** display snapshots from real saved checkpoint outputs; scrub by training step; dates/timestamps are experiment metadata, not simulated time.
- **Research cards:** separate researcher-authored hypotheses from SEED-generated ones. No external-agent work is attributed to SEED's trained neural model.
- **Privacy:** allow visitors to play with a locally loaded published model; don't send prompts or browser memories into a shared training pool.
- **Empty states:** `NO EXPERIMENTAL RUNS PUBLISHED YET`, `CURRENTLY ONLY SEED-0 EXISTS`, `THIS GRAPH WILL APPEAR AFTER VALIDATED BENCHMARKS`.

### Suggested approved static data contract
Static site hosted by GitHub Pages reads a single public versioned JSON file, e.g. `public/observatory/v1.json`, created ONLY by a reviewed/exported whitelist process from the private SEED-LAB repository.

```json
{
  "schema_version": 1,
  "published_at": "2026-10-09T00:00:00Z",
  "source": "approved experimental summary, never raw training data",
  "models": [
    {
      "id": "seed-0",
      "status": "implemented",
      "architecture": "seed0-context3-mlp",
      "parameters": 6672,
      "context_chars": 3,
      "checkpoint_available": false
    }
  ],
  "experiments": []
}
```

This is a **schema illustration**, not a real result publication; the `published_at` field must be replaced with the true generation time during export.

Future experiment records should have `experiment_id`, `architecture_id`, immutable `source_commit`, `dataset_manifest_id`, `validation_split_sha256`, `training_configuration_sha256`, `seed`, `training_tokens_seen`, `validation_bpc`, `train_seconds`, `peak_ram_bytes`, `checkpoint_sha256`, optional test score **only after sealed holdout**, and timestamps. Never expose unapproved dataset text, private logs, repository secrets or user memories.

### Implementation sequencing — later PRs
1. Establish a PUBLIC whitelist/schema and consumer-side type/shape validation. Separate draft test data from published verified data.
2. Build static Observatory shell (Overview, Evolution, Arena and Research empty states) with responsive visual system and no backend calls.
3. Import genuinely approved aggregate SEED-LAB benchmark reports via review and a one-way publication path.
4. Add plotted learning curves and recorded checkpoint playback, both sourced from actual experiment artifacts.
5. Build model selectors and browser inference adapters only after the candidate model's serialization/inference code exists and is tested.
6. Tune performance, mobile usability and accessibility. Screenshot-test desktop/mobile and verify Github Pages relative paths.
7. Preserve current conversation and local-memory flows throughout. **No live deployment without review.**

### Acceptance criteria
- Strict grayscale and editorial, rather than a default admin dashboard style.
- Small meaningful number of views with strong typography, calm negative space and consistent detail.
- No invented measurements or implied training progress.
- Real training outputs and safe published model artifacts are always traceable to experiment/run IDs.
- Keyboard and mobile interaction are complete.
- Original local SEED-0 remains usable; local memory never leaks into public reports.
- Site still runs as static files on GitHub Pages, without making Hermes or external commercial LLM APIs the runtime brain.
