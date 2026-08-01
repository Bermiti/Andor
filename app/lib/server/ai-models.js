import 'server-only';

function configuredModel(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

// Pinned production model IDs verified against provider documentation on
// 2026-08-01. Environment overrides keep future migrations explicit.
export const AI_MODELS = Object.freeze({
  google: configuredModel('ANDOR_GOOGLE_MODEL', 'gemini-3.6-flash'),
  anthropic: configuredModel('ANDOR_ANTHROPIC_MODEL', 'claude-sonnet-5'),
  groq: configuredModel('ANDOR_GROQ_MODEL', 'openai/gpt-oss-120b'),
});
