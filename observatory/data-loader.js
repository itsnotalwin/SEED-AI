/**
 * SEED Observatory — Data Loader
 * Loads verified experiment reports from public JSON.
 * No private data, no credentials.
 */
const OBSERVATORY_DATA_URL = './public/observatory/v1.json';

async function loadObservatoryData() {
  try {
    const response = await fetch(OBSERVATORY_DATA_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return validateObservatoryData(data);
  } catch (error) {
    console.warn('Observatory data load failed, using defaults:', error.message);
    return getDefaultData();
  }
}

function validateObservatoryData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid observatory data: not an object');
  }
  if (data.schema_version !== 1) {
    console.warn(`Unexpected schema version: ${data.schema_version}`);
  }
  // Ensure required arrays exist
  data.models = Array.isArray(data.models) ? data.models : [];
  data.experiments = Array.isArray(data.experiments) ? data.experiments : [];
  data.research_entries = Array.isArray(data.research_entries) ? data.research_entries : [];
  return data;
}

function getDefaultData() {
  return {
    schema_version: 1,
    published_at: new Date().toISOString(),
    source: 'default fallback — no published data available',
    models: [
      {
        id: 'seed-0',
        status: 'implemented',
        architecture: 'seed0-context3-mlp',
        parameters: 6672,
        context_chars: 3,
        checkpoint_available: false,
        description: 'Original three-character contextual neural language model. Fixed context of 3 characters, 8-dim embeddings, 48-unit tanh hidden layer.'
      }
    ],
    experiments: [],
    research_entries: [],
  };
}

export { loadObservatoryData, getDefaultData };