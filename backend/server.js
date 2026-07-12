import './config/env.js';
import express from 'express';
import cors from 'cors';
import { registerChatRoutes } from './routes/chat.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerBillingRoutes } from './routes/billing.js';
import { registerWebhookRoutes } from './routes/webhooks.js';

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