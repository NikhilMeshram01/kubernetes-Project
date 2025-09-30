import app from './app.js';
import { PORT } from './configs/configs.js';
import { JOB_TYPES } from './configs/constants.js';

const port = PORT || 7001;

app.listen(port, () => {
  console.log(`Job Submitter service running on port ${port}`);
  console.log(`Available job types: ${Object.keys(JOB_TYPES).join(', ')}`);
});
