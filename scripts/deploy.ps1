# Build and push Docker images
Write-Host "Building and pushing Docker images..." -ForegroundColor Green

# Service A
Write-Host "Building Service A..." -ForegroundColor Yellow
Set-Location service_a
docker build -t nikhilmindfire/service-a:latest .
docker push nikhilmindfire/service-a:latest

# Service B
Write-Host "Building Service B..." -ForegroundColor Yellow
Set-Location ../service_b
docker build -t nikhilmindfire/service-b:latest .
docker push nikhilmindfire/service-b:latest

# Service C
Write-Host "Building Service C..." -ForegroundColor Yellow
Set-Location ../service_c
docker build -t nikhilmindfire/service-c:latest .
docker push nikhilmindfire/service-c:latest

Set-Location ..

# Deploy to Kubernetes
Write-Host "Deploying to Kubernetes..." -ForegroundColor Green

kubectl apply -f k8s/namespace.yaml
Start-Sleep -Seconds 2

kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/service-a.yaml
kubectl apply -f k8s/service-b.yaml
kubectl apply -f k8s/service-c.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/metrics-server.yaml

# Install Prometheus and Grafana
Write-Host "Installing Prometheus and Grafana..." -ForegroundColor Green
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --create-namespace `
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Wait for pods to be ready
Write-Host "Waiting for pods to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Check pod status
Write-Host "Checking pod status..." -ForegroundColor Yellow
kubectl get pods -n job-system
kubectl get pods -n monitoring

# Apply ServiceMonitors
Write-Host "Applying ServiceMonitors..." -ForegroundColor Yellow
kubectl apply -f k8s/service-monitor.yaml

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Run 'kubectl get pods -n job-system' to check status" -ForegroundColor Cyan