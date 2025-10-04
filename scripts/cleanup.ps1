Write-Host "🧹 CLEANING UP DEPLOYMENT" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "`nStopping all port forwarding..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

Write-Host "Deleting Kubernetes resources..." -ForegroundColor Yellow
kubectl delete namespace job-system --ignore-not-found=true
kubectl delete namespace monitoring --ignore-not-found=true

Write-Host "Removing Helm releases..." -ForegroundColor Yellow
helm uninstall prometheus --namespace monitoring 2>&1 | Out-Null

Write-Host "Cleaning up Docker images..." -ForegroundColor Yellow
docker images | findstr "nikhilmindfire" | ForEach-Object {
    $imageId = ($_ -split '\s+')[2]
    docker rmi $imageId -f 2>&1 | Out-Null
}

Write-Host "`n✅ CLEANUP COMPLETE" -ForegroundColor Green