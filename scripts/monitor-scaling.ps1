Write-Host "=== Real-time HPA & Pod Monitoring ===" -ForegroundColor Cyan
Write-Host "Monitoring auto-scaling in action..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray

$monitorCount = 0
while ($true) {
    $monitorCount++
    Clear-Host
    Write-Host "=== Monitoring Cycle #$monitorCount ===" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    
    Write-Host "`n--- HPA Status ---" -ForegroundColor Yellow
    kubectl get hpa -n job-system
    
    Write-Host "`n--- Service B Pods ---" -ForegroundColor Yellow  
    kubectl get pods -n job-system -l app=service-b
    
    Write-Host "`n--- Resource Usage ---" -ForegroundColor Yellow
    $topOutput = kubectl top pods -n job-system 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host $topOutput -ForegroundColor White
    } else {
        Write-Host "Metrics not available yet..." -ForegroundColor Red
    }
    
    Write-Host "`n--- Service B Logs (latest) ---" -ForegroundColor Yellow
    kubectl logs -n job-system deployment/service-b --tail=2 2>$null
    
    Write-Host "`n--- Checking Metrics Endpoints ---" -ForegroundColor Yellow
    try {
        $metrics = Invoke-WebRequest -Uri "http://localhost/worker/metrics" -TimeoutSec 3
        $jobsProcessed = ($metrics.Content -split "`n" | Select-String "jobs_processed_total")[0]
        Write-Host "Jobs processed: $jobsProcessed" -ForegroundColor Green
    } catch {
        Write-Host "Could not fetch metrics" -ForegroundColor Red
    }
    
    Write-Host "`nPress Ctrl+C to stop monitoring..." -ForegroundColor Gray
    Write-Host "Next update in 10 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
}