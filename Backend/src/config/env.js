import dotenv from 'dotenv';
dotenv.config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Validate that at least the primary AI provider key is set
const providerKeyMap = {
  gemini: 'GOOGLE_GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  sambanova: 'SAMBANOVA_API_KEY',
};
const primaryProvider = process.env.PRIMARY_AI_PROVIDER || 'gemini';
const primaryKey = providerKeyMap[primaryProvider];
if (primaryKey && !process.env[primaryKey]) {
  console.error(`[ENV] PRIMARY_AI_PROVIDER is "${primaryProvider}" but ${primaryKey} is not set`);
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim()),

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  ai: {
    primaryProvider: process.env.PRIMARY_AI_PROVIDER || 'gemini',
    fallbackProvider: process.env.FALLBACK_AI_PROVIDER || 'groq',
    geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY || '',
    sambanovaApiKey: process.env.SAMBANOVA_API_KEY || '',
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  },

  quotas: {
    defaultDailyLimit: parseInt(process.env.DEFAULT_DAILY_LIMIT || '50', 10),
  },
};
