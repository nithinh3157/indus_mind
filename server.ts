import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Health check for INDUSMIND web server
app.get('/api/health', (_req, res) => {
  res.json({
    service: 'INDUSMIND Web & AI Proxy',
    status: 'ok',
    fastApiTarget: process.env.VITE_FASTAPI_BASE_URL || 'simulated-frontend-adapter',
  });
});

// Grounded AI Factory Assistant endpoint (strictly grounded in provided application records)
app.post('/api/assistant/ask', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      error:
        'GEMINI_API_KEY is not configured in the server environment. Add a valid key in Settings > Secrets, or use Deterministic Data Query mode.',
    });
    return;
  }

  const { query, context } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'A question string is required.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = [
      'You are INDUSMIND AI, an industrial manufacturing operations analyst for a unified platform covering AutoForge (Automobile) and DairyFlow (Dairy).',
      'STRICT GROUNDING RULE: Answer ONLY using the JSON application records provided in the user message.',
      'NEVER invent, extrapolate, or fabricate database figures, timestamps, or batch IDs not present in the context.',
      'Clearly mention when metrics are simulated estimates. Never directly compare vehicle counts to milk litres.',
      'Be concise, quantitative, structured with bullet points, and cite the exact stage, machine ID, or batch ID from the context.',
    ].join(' ');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Question: ${query}\n\nLive Application Records (JSON):\n${JSON.stringify(context)}`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(502).json({ error: 'Gemini returned an empty response.' });
      return;
    }

    res.json({ answer: text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upstream AI error';
    res.status(502).json({ error: `INDUSMIND AI upstream error: ${message}` });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`INDUSMIND server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
