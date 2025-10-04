[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "🧪 SYSTEM TESTING" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Cyan

# Test 1: Check Pod Status
Write-Host "`n1. Checking Pod Status..." -ForegroundColor Yellow
kubectl get pods -n job-system

# Test 2: Test Health Endpoints
Write-Host "`n2. Testing Service Health..." -ForegroundColor Yellow
$services = @(
    @{Name="Service A"; Port=5001; Path="/health"; Service="service-a"},
    @{Name="Service B"; Port=5002; Path="/api/v1/worker/metrics"; Service="service-b"},
    @{Name="Service C"; Port=5003; Path="/api/v1/stats/stats"; Service="service-c"}
)

foreach ($service in $services) {
    Write-Host "  Testing $($service.Name)..." -ForegroundColor Cyan -NoNewline
    $localPort = $service.Port  # Use the same port locally for simplicity
    $portForwardJob = Start-Job -ScriptBlock { 
        param($ns, $svc, $lp, $sp)
        kubectl port-forward -n $ns service/$svc "$lp`:$sp"
    } -ArgumentList "job-system", $service.Service, $localPort, $service.Port
    Start-Sleep -Seconds 5  # Wait for port-forwarding to establish

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($localPort)$($service.Path)" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host " SUCCESS" -ForegroundColor Green
        } else {
            Write-Host " FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host " FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
    } finally {
        Get-Job | Where-Object { $_.Command -like "*port-forward*" -and $_.State -eq "Running" } | Stop-Job | Remove-Job
    }
}

# Test 3: Submit Test Job
Write-Host "`n3. Testing Job Submission..." -ForegroundColor Yellow
$portForwardJob = Start-Job -ScriptBlock { 
    param($ns, $svc, $lp, $sp)
    kubectl port-forward -n $ns service/$svc "$lp`:$sp"
} -ArgumentList "job-system", "service-a", 8080, 5001 | Out-Null
Start-Sleep -Seconds 5

try {
    $body = @{
        type = "prime_calculation"
        data = @{ max = 1000 }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Host "  Job submitted: $($response.jobId) SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "  Job submission failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job
}

Write-Host "`n🧪 SYSTEM TESTING COMPLETE" -ForegroundColor Green

# Write-Host "🧪 SYSTEM TESTING" -ForegroundColor Green
# Write-Host "=================" -ForegroundColor Cyan

# # Test 1: Check Pod Status
# Write-Host "`n1. Checking Pod Status..." -ForegroundColor Yellow
# kubectl get pods -n job-system

# # Test 2: Test Health Endpoints
# Write-Host "`n2. Testing Service Health..." -ForegroundColor Yellow
# $services = @(
#     @{Name="Service A"; Port=5001; Path="/health"},
#     @{Name="Service B"; Port=5002; Path="/api/v1/worker/metrics"},
#     @{Name="Service C"; Port=5003; Path="/api/v1/stats/stats"}
# )

# foreach ($service in $services) {
#     Write-Host "  Testing $($service.Name)..." -ForegroundColor Cyan -NoNewline
#     $result = kubectl exec -n job-system deployment/$($service.Name.ToLower().Replace(" ","-")) -- wget -q -O - http://localhost:$($service.Port)$($service.Path) 2>&1
#     if ($LASTEXITCODE -eq 0) {
#         Write-Host " SUCCESS" -ForegroundColor Green
#     } else {
#         Write-Host " FAILED" -ForegroundColor Red
#     }
# }

# # Test 3: Submit Test Job
# Write-Host "`n3. Testing Job Submission..." -ForegroundColor Yellow
# # kubectl port-forward -n job-system service/service-a 8080:5001 -Background | Out-Null
# # Start-Sleep -Seconds 2
# Start-Job -ScriptBlock { kubectl port-forward -n job-system service/service-a 8080:5001 } | Out-Null

# try {
#     $body = @{
#         type = "prime_calculation"
#         data = @{ max = 1000 }
#     } | ConvertTo-Json
    
#     $response = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json"
#     Write-Host "  Job submitted: $($response.jobId) SUCCESS" -ForegroundColor Green
# } catch {
#     Write-Host "  Job submission failed: $($_.Exception.Message)" -ForegroundColor Red
# }

# # Cleanup port forwarding
# Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

# Write-Host "`n SYSTEM TESTING COMPLETE" -ForegroundColor Green