# Service A: Job Submitter (API Gateway)

## Overview

Service A is an API Gateway that provides endpoints for submitting jobs and checking their status. It interacts with a Redis queue to manage job processing and returns job IDs to clients for tracking purposes.

## Features

- **Endpoints**:
  - `/submit`: Accepts job submissions and pushes them into a Redis queue.
  - `/status/:id`: Retrieves the status of a job using its unique job ID.
- **Job Management**:
  - Pushes jobs to a Redis queue for asynchronous processing.
  - Generates and returns a unique job ID to the client upon submission.

## Installation

1. **Prerequisites**:
   - Node.js (or relevant runtime environment)
   - Redis server
2. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
3. Install Dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables:
   - Create a `.env` file with the following:
     ```env
     REDIS_HOST=localhost
     REDIS_PORT=6379
     PORT=3000
     ```
5. Start the service:
   ```bash
   npm start
   ```

## Usage

### Submitting a Job

- **Endpoint**: `POST /submit`
- **Request Body**:
  ```json
  {
    "jobData": "<your-job-data>"
  }
  ```
- **Response**:
  ```json
  {
    "jobId": "<unique-job-id>"
  }
  ```

### Checking Job Status

- **Endpoint**: `GET /status/:id`
- **Response**:
  ```json
  {
    "jobId": "<unique-job-id>",
    "status": "<job-status>"
  }
  ```

## Dependencies

- **Redis**: For queue management.
- **Express.js** (or equivalent): For handling HTTP requests (if using Node.js).
- Other dependencies as listed in `package.json`.

## Development

- **Testing**:
  ```bash
  npm test
  ```
- **Linting**:
  ```bash
  npm run lint
  ```

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
