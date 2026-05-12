/**
 * Health Check Route
 * Simple health endpoint for monitoring
 */

export async function registerHealthRoutes(app) {
  app.get('/health', (req, res) => res.json({ status: 'Backend OK' }));
}
