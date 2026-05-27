import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerChatRoutes } from './routes/chat.js';
import { registerHealthRoutes } from './routes/health.js';

// Load environment variables from .env file
const result = dotenv.config();
console.log('DOTENV RESULT:', result);
console.log('CURRENT DIR:', process.cwd());
console.log('GROQ KEY:', process.env.GROQ_API_KEY);
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

// Register routes
registerChatRoutes(app);
registerHealthRoutes(app);

app.listen(PORT, () => {
  // Backend running silently
});