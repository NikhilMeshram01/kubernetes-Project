#!/bin/bash

# Build and push Docker images
echo "Building and pushing Docker images..."

cd service_a
docker build -t nikhilmindfire/service-a:latest .
docker push nikhilmindfire/service-a:latest

cd ../service_b
docker build -t nikhilmindfire/service-b:latest .
docker push nikhilmindfire/service-b:latest

cd ../service_c
docker build -t nikhilmindfire/service-c:latest .
docker push nikhilmindfire/service-c:latest

cd ..

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/service-a.yaml
kubectl apply -f k8s/service-b.yaml
kubectl apply -f k8s/service-c.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/metrics-server.yaml

# Install Prometheus and Grafana
echo "Installing Prometheus and Grafana..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=service-a -n job-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=service-b -n job-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=service-c -n job-system --timeout=300s

# Apply ServiceMonitors
kubectl apply -f k8s/service-monitor.yaml

echo "Deployment completed!"