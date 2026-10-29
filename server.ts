import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generateClinicalTriage } from './src/utils/clinicalTriage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    // Set a reasonable deadline so calls don't hang for 30s
    timeout: 10000,
  },
});

const SYSTEM_INSTRUCTION = `You are "FirstAid AI", a rapid first-aid triage assistant.

CRITICAL INGESTION RULE:
- Step 1: Examine the uploaded image AND text. State EXACTLY what injury you see (e.g. "Scraped knee", "Burn", "Cut").
- Step 2: NEVER assume an insect sting unless you see a bug bite/stinger or the text explicitly says "bee", "wasp", or "sting".
- Step 3: Keep output strictly under 100 words.

OUTPUT FORMAT:
Injury Identified: [State what you see]
Urgency: [Home Care Suitable / Consult Doctor / Emergency]

First-Aid Steps:
1. [Step 1]
2. [Step 2]
3. [What NOT to do]

Red Flags: [When to go to ER]`;

app.post('/api/triage', async (req, res) => {
  const { text = '', image, history } = req.body || {};

  if (!text && !image) {
    return res.status(400).json({ error: 'Please provide a description or upload an image of the injury.' });
  }

  const hasImage = !!(image && image.data);

  // Fast clinical fallback prepared in 0ms
  const clinicalResult = generateClinicalTriage(text, hasImage);

  // Attempt AI generation with a strict 4.5s race timeout so response is blazing fast
  const callGeminiPromise = async (): Promise<{ rawMarkdown: string; urgencyLevel: any } | null> => {
    try {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (hasImage) {
        let cleanData = image.data;
        let mimeType = image.mimeType || 'image/jpeg';

        if (cleanData.includes('base64,')) {
          const split = cleanData.split('base64,');
          cleanData = split[1];
          const match = split[0].match(/data:([^;]+);/);
          if (match && match[1]) {
            mimeType = match[1];
          }
        }

        parts.push({
          inlineData: {
            mimeType,
            data: cleanData,
          },
        });
      }

      let userPrompt = '';
      if (text && text.trim()) {
        userPrompt += `User Injury/Symptom Description: "${text.trim()}".\n`;
      } else {
        userPrompt += `The user has provided a photo of an injury without additional text.\n`;
      }

      if (history && Array.isArray(history) && history.length > 0) {
        userPrompt += `\nPrevious Triage Context & Follow-ups:\n`;
        for (const h of history.slice(-3)) {
          userPrompt += `${h.role === 'user' ? 'User' : 'FirstAid AI'}: ${h.content}\n`;
        }
      }

      if (hasImage) {
        userPrompt += `\nCRITICAL INGESTION RULE:
- Step 1: Examine the uploaded image AND text. State EXACTLY what injury you see (e.g. "Scraped knee", "Burn", "Cut").
- Step 2: NEVER assume an insect sting unless you see a bug bite/stinger or the text explicitly says "bee", "wasp", or "sting".
- Step 3: Keep output strictly under 100 words.`;
      }

      userPrompt += `\nStrictly adhere to the OUTPUT FORMAT and keep response under 100 words.`;

      parts.push({ text: userPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
        },
      });

      const rawMarkdown = response.text || '';
      if (!rawMarkdown.trim()) return null;

      let urgencyLevel = 'Home Care Suitable';
      if (/Urgency:\s*Emergency/i.test(rawMarkdown) || /URGENCY LEVEL:\s*Emergency/i.test(rawMarkdown)) {
        urgencyLevel = 'Emergency';
      } else if (/Urgency:\s*Consult Doctor/i.test(rawMarkdown) || /URGENCY LEVEL:\s*Consult Doctor/i.test(rawMarkdown)) {
        urgencyLevel = 'Consult Doctor';
      } else if (/Urgency:\s*Home Care/i.test(rawMarkdown) || /URGENCY LEVEL:\s*Home Care/i.test(rawMarkdown)) {
        urgencyLevel = 'Home Care Suitable';
      }

      return { rawMarkdown, urgencyLevel };
    } catch (err: any) {
      console.warn('Gemini triage delayed/unavailable, using clinical fallback engine:', err?.message || err);
      return null;
    }
  };

  // Race promise: Gemini call with 4.5-second cap for ultra-fast response
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4500));

  try {
    const aiResult = await Promise.race([callGeminiPromise(), timeoutPromise]);

    if (aiResult && aiResult.rawMarkdown) {
      return res.json({
        success: true,
        rawMarkdown: aiResult.rawMarkdown,
        urgencyLevel: aiResult.urgencyLevel,
        source: 'ai',
      });
    }

    // Return instant clinical triage
    return res.json({
      success: true,
      rawMarkdown: clinicalResult.rawMarkdown,
      urgencyLevel: clinicalResult.urgencyLevel,
      source: 'clinical',
    });
  } catch (error: any) {
    console.error('Unhandled triage error:', error);
    // Never fail with 500 or HTML - return resilient clinical triage
    return res.json({
      success: true,
      rawMarkdown: clinicalResult.rawMarkdown,
      urgencyLevel: clinicalResult.urgencyLevel,
      source: 'clinical',
    });
  }
});

// Production vs Dev setup
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FirstAid AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
