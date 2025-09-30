import app from './app.js';
import { PORT } from './configs/configs.js';
import { updateMetrics } from './utils/updateMetrics.js';

const port = PORT || 7003;

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Stats Aggregator service running on port ${port}`);

  // Update metrics every 30 seconds
  setInterval(updateMetrics, 30000);

  // Initial metrics update
  updateMetrics();
});
