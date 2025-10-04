Write-Host "DEPLOYING TO KUBERNETES" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Cyan

# Create namespace
Write-Host "Creating namespace job-system..." -ForegroundColor Yellow -NoNewline
kubectl create namespace job-system --dry-run=client -o yaml | kubectl apply -f - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host " SUCCESS" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
}

# Deploy all manifests
$k8sDir = Join-Path -Path $PSScriptRoot -ChildPath "..\k8s"
Write-Host "Looking for manifests in: $k8sDir" -ForegroundColor Cyan
$manifests = Get-ChildItem -Path $k8sDir -Filter "*.yaml"

foreach ($manifest in $manifests) {
    Write-Host "Deploying $($manifest.Name)..." -ForegroundColor Yellow -NoNewline
    kubectl apply -f $manifest.FullName 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " SUCCESS" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

# Wait for deployment
Write-Host "`nWaiting for pods to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check status
Write-Host "`nDeployment Status:" -ForegroundColor Cyan
kubectl get all -n job-system

Write-Host "`nKUBERNETES DEPLOYMENT COMPLETE" -ForegroundColor Green