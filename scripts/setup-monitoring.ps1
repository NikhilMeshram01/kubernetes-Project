Write-Host "SETTING UP MONITORING" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Cyan

# Add Helm repo
Write-Host "Adding Helm repositories..." -ForegroundColor Yellow
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Clean up residual resources
Write-Host "Cleaning up residual resources..." -ForegroundColor Yellow
helm uninstall monitoring-stack -n monitoring --ignore-not-found
kubectl -n monitoring delete pods --all --force
kubectl -n monitoring delete statefulsets --all --force
kubectl -n monitoring delete deployments --all --force

# Install monitoring stack
Write-Host "Installing Prometheus Stack..." -ForegroundColor Yellow
helm install monitoring-stack prometheus-community/kube-prometheus-stack `
    --namespace monitoring `
    --create-namespace `
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false `
    --set grafana.adminPassword=admin `
    --set prometheus-node-exporter.resources.requests.cpu=300m `
    --set prometheus-node-exporter.resources.requests.memory=384Mi `
    --set prometheus-node-exporter.resources.limits.cpu=750m `
    --set prometheus-node-exporter.resources.limits.memory=768Mi `
    --set prometheus-node-exporter.args[0]=--collector.systemd.enable=false `
    --set prometheus-node-exporter.args[1]=--collector.filesystem.enabled=false `
    --set prometheus-node-exporter.hostRootfsMount.enabled=false `
    --set prometheus-node-exporter.image.repository=prometheus/node-exporter `
    --set prometheus-node-exporter.image.tag=v1.8.1 `
    --wait

# Apply ServiceMonitors
Write-Host "Configuring ServiceMonitors..." -ForegroundColor Yellow
kubectl apply -f ../k8s/service-monitor.yaml

Write-Host "`nWaiting for monitoring to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 180

# Check monitoring status
Write-Host "`nMonitoring Status:" -ForegroundColor Cyan
kubectl get pods -n monitoring

# Check node-exporter status
Write-Host "`nChecking Prometheus Node Exporter status..." -ForegroundColor Yellow
$nodeExporterPod = (kubectl -n monitoring get pod -l app.kubernetes.io/name=prometheus-node-exporter -o jsonpath="{.items[0].metadata.name}" 2>$null)
if ($nodeExporterPod) {
    $ready = (kubectl -n monitoring get pod $nodeExporterPod -o jsonpath="{.status.containerStatuses[0].ready}" 2>$null)
    $status = (kubectl -n monitoring get pod $nodeExporterPod -o jsonpath="{.status.phase}" 2>$null)
    if ($ready -eq "true" -and $status -eq "Running") {
        Write-Host "Node Exporter pod $nodeExporterPod is running and ready" -ForegroundColor Green
    } else {
        Write-Host "Node Exporter pod $nodeExporterPod is not ready (Status: $status). Checking logs..." -ForegroundColor Red
        kubectl -n monitoring logs $nodeExporterPod
        Write-Host "Checking pod events..." -ForegroundColor Yellow
        kubectl -n monitoring describe pod $nodeExporterPod
    }
} else {
    Write-Host "Node Exporter pod not found" -ForegroundColor Red
}

# Verify Prometheus accessibility
Write-Host "`nVerifying Prometheus..." -ForegroundColor Yellow
$prometheusService = "monitoring-stack-kube-prom-prometheus"
Write-Host "Prometheus service: $prometheusService" -ForegroundColor Green
Write-Host "Waiting for Prometheus pod to be ready..." -ForegroundColor Yellow
kubectl -n monitoring wait --for=condition=Ready pod -l app.kubernetes.io/name=prometheus --timeout=300s
$prometheusJob = Start-Job -ScriptBlock { param($svc) kubectl -n monitoring port-forward svc/$svc 9090:9090 --address 127.0.0.1 } -ArgumentList $prometheusService
Start-Sleep -Seconds 5
$retryCount = 3
$success = $false
for ($i = 1; $i -le $retryCount; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090" -Method GET -TimeoutSec 5
        Write-Host "Prometheus is accessible" -ForegroundColor Green
        $success = $true
        break
    } catch {
        Write-Host "Attempt ${i}/${retryCount}: Prometheus is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
}
if (-not $success) {
    Write-Host "Checking Prometheus pod logs..." -ForegroundColor Yellow
    kubectl -n monitoring logs prometheus-monitoring-stack-kube-prom-prometheus-0
    Write-Host "Checking service endpoints..." -ForegroundColor Yellow
    kubectl -n monitoring get endpoints monitoring-stack-kube-prom-prometheus
}
# Stop the port-forward job
Stop-Job -Job $prometheusJob
Remove-Job -Job $prometheusJob -Force

# Verify Grafana accessibility
Write-Host "`nVerifying Grafana..." -ForegroundColor Yellow
$grafanaJob = Start-Job -ScriptBlock { kubectl -n monitoring port-forward svc/monitoring-stack-grafana 3000:80 --address 127.0.0.1 }
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    Write-Host "Grafana is accessible" -ForegroundColor Green
} catch {
    Write-Host "Grafana is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}
# Stop the port-forward job
Stop-Job -Job $grafanaJob
Remove-Job -Job $grafanaJob -Force

Write-Host "`nMONITORING SETUP COMPLETE" -ForegroundColor Green

# Write-Host "SETTING UP MONITORING" -ForegroundColor Green
# Write-Host "========================" -ForegroundColor Cyan

# # Add Helm repo
# Write-Host "Adding Helm repositories..." -ForegroundColor Yellow
# helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
# helm repo update

# # Clean up residual resources
# Write-Host "Cleaning up residual resources..." -ForegroundColor Yellow
# helm uninstall monitoring-stack -n monitoring --ignore-not-found
# kubectl -n monitoring delete pods --all --force
# kubectl -n monitoring delete statefulsets --all --force
# kubectl -n monitoring delete deployments --all --force

# # Install monitoring stack
# Write-Host "Installing Prometheus Stack..." -ForegroundColor Yellow
# helm install monitoring-stack prometheus-community/kube-prometheus-stack `
#     --namespace monitoring `
#     --create-namespace `
#     --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false `
#     --set grafana.adminPassword=admin `
#     --set prometheus-node-exporter.resources.requests.cpu=300m `
#     --set prometheus-node-exporter.resources.requests.memory=384Mi `
#     --set prometheus-node-exporter.resources.limits.cpu=750m `
#     --set prometheus-node-exporter.resources.limits.memory=768Mi `
#     --set prometheus-node-exporter.args[0]=--collector.systemd.enable=false `
#     --set prometheus-node-exporter.image.repository=prometheus/node-exporter `
#     --set prometheus-node-exporter.image.tag=v1.8.2 `
#     --wait

# # Apply ServiceMonitors
# Write-Host "Configuring ServiceMonitors..." -ForegroundColor Yellow
# kubectl apply -f ../k8s/service-monitor.yaml

# Write-Host "`nWaiting for monitoring to start..." -ForegroundColor Yellow
# Start-Sleep -Seconds 120

# # Check monitoring status
# Write-Host "`nMonitoring Status:" -ForegroundColor Cyan
# kubectl get pods -n monitoring

# # Check node-exporter status
# Write-Host "`nChecking Prometheus Node Exporter status..." -ForegroundColor Yellow
# $nodeExporterPod = (kubectl -n monitoring get pod -l app.kubernetes.io/name=prometheus-node-exporter -o jsonpath="{.items[0].metadata.name}" 2>$null)
# if ($nodeExporterPod) {
#     $ready = (kubectl -n monitoring get pod $nodeExporterPod -o jsonpath="{.status.containerStatuses[0].ready}" 2>$null)
#     $status = (kubectl -n monitoring get pod $nodeExporterPod -o jsonpath="{.status.phase}" 2>$null)
#     if ($ready -eq "true" -and $status -eq "Running") {
#         Write-Host "Node Exporter pod $nodeExporterPod is running and ready" -ForegroundColor Green
#     } else {
#         Write-Host "Node Exporter pod $nodeExporterPod is not ready (Status: $status). Checking logs..." -ForegroundColor Red
#         kubectl -n monitoring logs $nodeExporterPod
#         Write-Host "Checking pod events..." -ForegroundColor Yellow
#         kubectl -n monitoring describe pod $nodeExporterPod
#     }
# } else {
#     Write-Host "Node Exporter pod not found" -ForegroundColor Red
# }

# # Verify Prometheus accessibility
# Write-Host "`nVerifying Prometheus..." -ForegroundColor Yellow
# $prometheusService = "monitoring-stack-kube-prom-prometheus"
# Write-Host "Prometheus service: $prometheusService" -ForegroundColor Green
# Write-Host "Waiting for Prometheus pod to be ready..." -ForegroundColor Yellow
# kubectl -n monitoring wait --for=condition=Ready pod -l app.kubernetes.io/name=prometheus --timeout=300s
# $prometheusJob = Start-Job -ScriptBlock { param($svc) kubectl -n monitoring port-forward svc/$svc 9090:9090 --address 127.0.0.1 } -ArgumentList $prometheusService
# Start-Sleep -Seconds 5
# $retryCount = 3
# $success = $false
# for ($i = 1; $i -le $retryCount; $i++) {
#     try {
#         $response = Invoke-WebRequest -Uri "http://localhost:9090" -Method GET -TimeoutSec 5
#         Write-Host "Prometheus is accessible" -ForegroundColor Green
#         $success = $true
#         break
#     } catch {
#         Write-Host "Attempt ${i}/${retryCount}: Prometheus is not accessible: $($_.Exception.Message)" -ForegroundColor Red
#         Start-Sleep -Seconds 5
#     }
# }
# if (-not $success) {
#     Write-Host "Checking Prometheus pod logs..." -ForegroundColor Yellow
#     kubectl -n monitoring logs prometheus-monitoring-stack-kube-prom-prometheus-0
#     Write-Host "Checking service endpoints..." -ForegroundColor Yellow
#     kubectl -n monitoring get endpoints monitoring-stack-kube-prom-prometheus
# }
# # Stop the port-forward job
# Stop-Job -Job $prometheusJob
# Remove-Job -Job $prometheusJob -Force

# # Verify Grafana accessibility
# Write-Host "`nVerifying Grafana..." -ForegroundColor Yellow
# $grafanaJob = Start-Job -ScriptBlock { kubectl -n monitoring port-forward svc/monitoring-stack-grafana 3000:80 --address 127.0.0.1 }
# Start-Sleep -Seconds 5
# try {
#     $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
#     Write-Host "Grafana is accessible" -ForegroundColor Green
# } catch {
#     Write-Host "Grafana is not accessible: $($_.Exception.Message)" -ForegroundColor Red
# }
# # Stop the port-forward job
# Stop-Job -Job $grafanaJob
# Remove-Job -Job $grafanaJob -Force

# Write-Host "`nMONITORING SETUP COMPLETE" -ForegroundColor Green
