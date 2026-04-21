import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API route - inline Groq handler for local dev
app.post('/api/chat', async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    console.log('Received message:', message);

    const { Groq } = await import('groq-sdk');
    console.log('API Key configured:', !!process.env.GROQ_API_KEY);
    
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    console.log('Making GROQ API call...');
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "llama-3.1-8b-instant",
    });

    res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('AI Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Health
app.get('/health', (req, res) => res.json({ status: 'Backend OK' }));

console.log(`Backend starting on http://localhost:${PORT}`);
app.listen(PORT, () => {
  console.log(`✅ Backend ready: http://localhost:${PORT}/health`);
});
