Write-Host "=== MASSIVE LOAD TEST - Trigger HPA Scaling ===" -ForegroundColor Red

$jobCount = 200  # Large number to ensure CPU load
Write-Host "Submitting $jobCount CPU-intensive jobs..." -ForegroundColor Yellow
Write-Host "This will trigger HPA to scale up Service B pods" -ForegroundColor Yellow

$successCount = 0
$failCount = 0
$startTime = Get-Date

# Generate rapid-fire requests
1..$jobCount | ForEach-Object {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost/job/submit" -Method POST -TimeoutSec 5
        $successCount++
        if ($successCount % 25 -eq 0) {
            $elapsed = (Get-Date) - $startTime
            Write-Host "Submitted $successCount jobs in $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Cyan
        }
    } catch {
        $failCount++
        # Don't show every error to avoid spam
        if ($failCount % 10 -eq 0) {
            Write-Host "$failCount jobs failed so far..." -ForegroundColor Red
        }
    }
    # Minimal delay for maximum load
    if ($_ % 50 -eq 0) {
        Start-Sleep -Milliseconds 100
    }
}

$totalTime = (Get-Date) - $startTime

Write-Host "`n=== Load Test Complete ===" -ForegroundColor Cyan
Write-Host "Total time: $([math]::Round($totalTime.TotalSeconds, 1)) seconds" -ForegroundColor White
Write-Host "Successful submissions: $successCount" -ForegroundColor Green
Write-Host "Failed submissions: $failCount" -ForegroundColor Red
Write-Host "Jobs per second: $([math]::Round($successCount / $totalTime.TotalSeconds, 1))" -ForegroundColor Yellow

Write-Host "`n=== Checking HPA Status ===" -ForegroundColor Yellow
kubectl get hpa -n job-system

Write-Host "`n=== Checking Service B Pods ===" -ForegroundColor Yellow
kubectl get pods -n job-system -l app=service-b

Write-Host "`n=== Checking Resource Usage ===" -ForegroundColor Yellow
kubectl top pods -n job-system

Write-Host "`n=== Checking Queue Status ===" -ForegroundColor Yellow
try {
    $queueLength = kubectl exec -n job-system deployment/redis -- redis-cli LLEN job-queue 2>$null
    Write-Host "Redis queue length: $queueLength" -ForegroundColor White
} catch {
    Write-Host "Could not check queue length" -ForegroundColor Red
}