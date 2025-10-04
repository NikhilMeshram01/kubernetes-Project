Write-Host "🧪 SYSTEM TESTING" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Cyan

# Start port forwarding
Write-Host "Starting port forwarding..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    kubectl port-forward -n job-system service/service-a 8080:5001
} | Out-Null
Start-Sleep -Seconds 3

# Test job submission
Write-Host "Testing job submission..." -ForegroundColor Yellow
try {
    $body = @{
        type = "prime_calculation"
        data = @{ max = 5000 }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Job submitted successfully: $($response.jobId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Job submission failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check stats
Write-Host "`nChecking system stats..." -ForegroundColor Yellow
kubectl exec -n job-system deployment/service-c -- node -e "
const http = require('http');
const req = http.request({
    hostname: 'localhost', port: 5003, path: '/api/v1/stats/stats', method: 'GET'
}, (res) => {
    let data = ''; res.on('data', (chunk) => data += chunk); 
    res.on('end', () => {
        const stats = JSON.parse(data);
        console.log('Total jobs:', stats.jobs.total);
        console.log('Queue length:', stats.queueLength);
    });
});
req.end();
"

# Cleanup
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

Write-Host "`n✅ SYSTEM TESTING COMPLETE" -ForegroundColor Green