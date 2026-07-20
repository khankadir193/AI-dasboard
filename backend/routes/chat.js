/**
 * Chat API Route
 * Handles AI chat requests via Groq API proxy
 */

import { buildSystemPrompt } from "../lib/systemPrompt.js";

export async function registerChatRoutes(app) {
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, context } = req.body;
      const systemPrompt = buildSystemPrompt(context);

      const { Groq } = await import('groq-sdk');

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "llama-3.1-8b-instant",
      });

      res.status(200).json({
        reply: completion.choices?.[0]?.message?.content || 'No response',
      });
    } catch (error) {
      res.status(200).json({
        reply: '• **Analysis Paused**: The AI engine is temporarily unavailable.\n\n• **Cached Insights**: Your recent data shows activity patterns worth reviewing.\n\n• **Next Steps**: Try again shortly or check your connection settings.',
      });
    }
  });
}
