import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import materialsRouter from './routes/materials.js';
import generateRouter from './routes/generate.js';
import chatRouter from './routes/chat.js';
import learningRouter from './routes/learning.js';

const app = express();

// --- Security middleware ---
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// --- CORS ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    providers: {
      primary: config.ai.primaryProvider,
      fallback: config.ai.fallbackProvider,
    },
  });
});

// --- Routes ---
app.use('/api/materials', materialsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/chat', chatRouter);
app.use('/api/learning', learningRouter);

// --- Error handling ---
app.use(errorHandler);

// --- Start server ---
app.listen(config.port, () => {
  console.log(`\n🚀 Quizora Learn Backend v2.0.0`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Primary AI: ${config.ai.primaryProvider}`);
  console.log(`   Fallback AI: ${config.ai.fallbackProvider}`);
  console.log(`   CORS: ${config.corsOrigins.join(', ')}\n`);
});
