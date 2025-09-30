# Kubernetes Microservices Monitoring System

A comprehensive microservices-based Node.js system deployed on Kubernetes with monitoring, auto-scaling, and stress testing capabilities.

## 🏗️ Architecture Overview

### Services

1. **Service A: Job Submitter (API Gateway)**

   - Exposes REST endpoints for job submission and status checking
   - Pushes jobs into Redis queue
   - Returns job ID to client

2. **Service B: Worker (Scalable)**

   - Consumes jobs from Redis queue
   - Performs CPU-intensive operations:
     - Prime number calculation up to 100,000
     - BCrypt hashing (10 rounds)
     - Array generation and sorting (100,000 integers)
   - Exposes Prometheus metrics
   - **This service gets horizontally scaled by HPA**

3. **Service C: Stats Aggregator**
   - Provides system statistics and metrics
   - Exposes Prometheus metrics for monitoring
   - Aggregates job processing data

### Infrastructure Components

- **Redis**: Message queue and job storage
- **Kubernetes HPA**: Auto-scales worker pods based on CPU/memory usage
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Ingress**: External access to services

## 🚀 Quick Start

### Prerequisites

- Docker
- Kubernetes cluster (Minikube, Kind, or cloud provider)
- kubectl configured
- Helm (optional, for advanced Prometheus setup)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd kubernetes-microservices-monitoring
```

### 2. Deploy the System

#### Option A: Using the deployment script (Linux/macOS)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### Option B: Manual deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=available --timeout=300s deployment/redis -n microservices-monitoring

# Build and deploy services
docker build -t job-submitter:latest ./service-a/
docker build -t worker:latest ./service-b/
docker build -t stats-aggregator:latest ./service-c/

# For minikube, load images
minikube image load job-submitter:latest
minikube image load worker:latest
minikube image load stats-aggregator:latest

# Deploy services
kubectl apply -f k8s/service-a.yaml
kubectl apply -f k8s/service-b.yaml
kubectl apply -f k8s/service-c.yaml
kubectl apply -f k8s/ingress.yaml

# Deploy monitoring
kubectl apply -f k8s/prometheus-config.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
kubectl apply -f k8s/grafana-deployment.yaml

# Wait for all services to be ready
kubectl wait --for=condition=available --timeout=300s deployment/job-submitter -n microservices-monitoring
kubectl wait --for=condition=available --timeout=300s deployment/worker -n microservices-monitoring
kubectl wait --for=condition=available --timeout=300s deployment/stats-aggregator -n microservices-monitoring
```

### 3. Access the Services

#### Get Ingress IP

```bash
# For minikube
minikube ip
kubectl get service -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.ports[0].nodePort}'

# For other clusters
kubectl get ingress microservices-ingress -n microservices-monitoring
```

#### API Endpoints

- **Submit Job**: `POST http://<ingress-ip>/api/submit`
- **Check Status**: `GET http://<ingress-ip>/api/status/:jobId`
- **Get Stats**: `GET http://<ingress-ip>/api/stats`
- **Queue Length**: `GET http://<ingress-ip>/api/queue-length`

#### Monitoring Access

```bash
# Grafana
kubectl port-forward svc/grafana-service 3000:80 -n microservices-monitoring
# Access: http://localhost:3000 (admin/admin123)

# Prometheus
kubectl port-forward svc/prometheus-service 9090:80 -n microservices-monitoring
# Access: http://localhost:9090
```

## 🧪 Running Stress Tests

### Option A: Using the stress test script (Linux/macOS)

```bash
chmod +x scripts/stress-test.sh
./scripts/stress-test.sh --total-requests 5000 --concurrent-users 200
```

### Option B: Using PowerShell (Windows)

```powershell
.\scripts\stress-test.ps1 -TotalRequests 5000 -ConcurrentUsers 200
```

### Option C: Manual testing with curl

```bash
# Submit a single job
curl -X POST http://<ingress-ip>/api/submit \
  -H "Content-Type: application/json" \
  -d '{"jobType": "prime-calculation", "data": {"max": 100000}}'

# Check job status
curl http://<ingress-ip>/api/status/<job-id>

# Get system stats
curl http://<ingress-ip>/api/stats
```

### Option D: Using Apache Bench (if available)

```bash
# Create payload file
echo '{"jobType": "prime-calculation", "data": {"max": 100000}}' > payload.json

# Run stress test
ab -n 5000 -c 200 -T "application/json" -p payload.json \
  http://<ingress-ip>/api/submit
```

## 📊 Monitoring and Observability

### Prometheus Metrics

#### Worker Service Metrics

- `jobs_processed_total`: Total jobs processed by type and status
- `job_processing_time_seconds`: Processing time histogram
- `job_errors_total`: Error count by error type
- `queue_length`: Current queue length

#### Stats Aggregator Metrics

- `total_jobs_submitted`: Total jobs submitted to system
- `total_jobs_completed`: Total jobs completed by type
- `average_processing_time_seconds`: Average processing time by job type

### Grafana Dashboard

The system includes a pre-configured Grafana dashboard with:

- Jobs processed over time
- Processing time percentiles
- Queue length monitoring
- Error rates
- Worker CPU and memory usage
- HPA scaling events

### HPA Configuration

The Horizontal Pod Autoscaler is configured to:

- Scale worker pods from 2 to 10 replicas
- Scale up when CPU > 70%
- Scale up when memory > 80%
- Scale down with stabilization windows to prevent thrashing

## 🔧 Configuration

### Environment Variables

#### Service A (Job Submitter)

- `REDIS_HOST`: Redis hostname (default: redis-service)
- `REDIS_PORT`: Redis port (default: 6379)
- `PORT`: Service port (default: 3001)

#### Service B (Worker)

- `REDIS_HOST`: Redis hostname (default: redis-service)
- `REDIS_PORT`: Redis port (default: 6379)
- `PORT`: Service port (default: 3002)

#### Service C (Stats Aggregator)

- `REDIS_HOST`: Redis hostname (default: redis-service)
- `REDIS_PORT`: Redis port (default: 6379)
- `PORT`: Service port (default: 3003)

### Job Types

1. **prime-calculation**: Calculate prime numbers up to specified limit
2. **bcrypt-hash**: Hash password using BCrypt with configurable rounds
3. **array-sort**: Generate and sort array of specified size

### Resource Limits

All services have configured resource requests and limits:

- **Job Submitter**: 128Mi-256Mi memory, 100m-200m CPU
- **Worker**: 256Mi-512Mi memory, 200m-500m CPU
- **Stats Aggregator**: 128Mi-256Mi memory, 100m-200m CPU
- **Redis**: 128Mi-256Mi memory, 100m-200m CPU

## 🐛 Troubleshooting

### Common Issues

#### 1. Services not starting

```bash
# Check pod status
kubectl get pods -n microservices-monitoring

# Check pod logs
kubectl logs -f deployment/job-submitter -n microservices-monitoring
kubectl logs -f deployment/worker -n microservices-monitoring
kubectl logs -f deployment/stats-aggregator -n microservices-monitoring
```

#### 2. Redis connection issues

```bash
# Check Redis pod
kubectl get pods -n microservices-monitoring -l app=redis

# Check Redis logs
kubectl logs -f deployment/redis -n microservices-monitoring

# Test Redis connectivity
kubectl exec -it deployment/redis -n microservices-monitoring -- redis-cli ping
```

#### 3. HPA not scaling

```bash
# Check HPA status
kubectl get hpa -n microservices-monitoring

# Describe HPA for details
kubectl describe hpa worker-hpa -n microservices-monitoring

# Check metrics server
kubectl top pods -n microservices-monitoring
```

#### 4. Ingress not accessible

```bash
# Check ingress status
kubectl get ingress -n microservices-monitoring

# Check ingress controller
kubectl get pods -n ingress-nginx

# For minikube, enable ingress
minikube addons enable ingress
```

### Useful Commands

```bash
# Get all resources in namespace
kubectl get all -n microservices-monitoring

# Scale worker deployment manually
kubectl scale deployment worker --replicas=5 -n microservices-monitoring

# Port forward for testing
kubectl port-forward svc/redis-service 6379:6379 -n microservices-monitoring

# Delete everything
kubectl delete namespace microservices-monitoring
```

## 📈 Performance Expectations

### Expected Behavior During Stress Test

1. **Initial Load**: Queue length increases rapidly
2. **HPA Triggering**: Worker pods scale up as CPU usage increases
3. **Queue Drainage**: As more workers come online, queue length decreases
4. **Stabilization**: System reaches equilibrium with appropriate number of workers

### Metrics to Watch

- **Queue Length**: Should peak during load test, then drain
- **Worker Pod Count**: Should scale from 2 to maximum 10 pods
- **CPU Usage**: Should trigger scaling around 70% utilization
- **Processing Time**: May increase during high load, then stabilize
- **Error Rate**: Should remain low (< 1%)

## 🔄 Development

### Local Development

```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:7-alpine

# Set environment variables
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Start services locally
cd service-a && npm install && npm start
cd service-b && npm install && npm start
cd service-c && npm install && npm start
```

### Building and Testing

```bash
# Build all images
npm run build:images

# Run tests (when implemented)
npm test

# Lint code
npm run lint
```

## 📝 API Documentation

### Submit Job

```http
POST /api/submit
Content-Type: application/json

{
  "jobType": "prime-calculation|bcrypt-hash|array-sort",
  "data": {
    "max": 100000,           // for prime-calculation
    "password": "mypassword", // for bcrypt-hash
    "size": 100000           // for array-sort
  }
}
```

**Response:**

```json
{
  "jobId": "uuid",
  "status": "queued",
  "message": "Job submitted successfully"
}
```

### Check Job Status

```http
GET /api/status/:jobId
```

**Response:**

```json
{
  "jobId": "uuid",
  "status": "queued|processing|completed|failed",
  "type": "prime-calculation",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:01:00.000Z",
  "result": { ... }
}
```

### Get System Stats

```http
GET /api/stats
```

**Response:**

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "queueLength": 5,
  "jobs": {
    "total": 100,
    "queued": 5,
    "processing": 2,
    "completed": 90,
    "failed": 3,
    "byType": {
      "prime-calculation": 50,
      "bcrypt-hash": 30,
      "array-sort": 20
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Kubernetes community for excellent documentation
- Prometheus and Grafana for monitoring capabilities
- Redis for reliable message queuing
- Node.js ecosystem for robust microservices development
