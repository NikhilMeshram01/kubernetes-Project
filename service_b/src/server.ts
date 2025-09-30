import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { PORT } from "./configs/configs.js";
import { worker } from "./utils/worker.js";

const port = PORT || 3002;

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`Worker service running on port ${port}`);
  // Start worker
  worker().catch(console.error);
});
