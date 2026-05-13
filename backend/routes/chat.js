/**
 * Chat API Route
 * Handles AI chat requests via Groq API proxy
 */

export async function registerChatRoutes(app) {
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body;

      const { Groq } = await import('groq-sdk');

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: "llama-3.1-8b-instant",
      });

      res.status(200).json({
        reply: completion.choices?.[0]?.message?.content || 'No response',
      });
    } catch (error) {
      res.status(500).json({ error: 'AI service unavailable' });
    }
  });
}
