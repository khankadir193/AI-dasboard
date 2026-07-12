import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerChatRoutes } from './routes/chat.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerBillingRoutes } from './routes/billing.js';
import { registerWebhookRoutes } from './routes/webhooks.js';

// Load environment variables from .env file
const result = dotenv.config();

// Validate required environment variables
if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Capture raw body for webhook signature verification before JSON parsing
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString()
    },
  })
)

// CORS
app.use(cors({ origin: 'http://localhost:5173' }));

// Register routes
registerChatRoutes(app);
registerHealthRoutes(app);
registerBillingRoutes(app);
registerWebhookRoutes(app);

app.listen(PORT, () => {
  // Backend running silently
});