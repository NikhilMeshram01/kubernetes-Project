Write-Host "=== Testing Simple Ingress Configuration ===" -ForegroundColor Cyan

$endpoints = @(
    # Service A - Job Submitter
    @{Url = "http://localhost/health"; Name = "Service A Health"},
    @{Url = "http://localhost/job/submit"; Name = "Job Submit"},
    @{Url = "http://localhost/job/status/123"; Name = "Job Status"},
    
    # Service B - Worker
    @{Url = "http://localhost/health"; Name = "Service B Health"},
    @{Url = "http://localhost/worker/metrics"; Name = "Service B Metrics"},
    
    # Service C - Stats
    @{Url = "http://localhost/health"; Name = "Service C Health"},
    @{Url = "http://localhost/stats/stats"; Name = "Service C Stats"},
    @{Url = "http://localhost/stats/detailed"; Name = "Service C Detailed Stats"},
    @{Url = "http://localhost/stats/metrics"; Name = "Service C Metrics"},
    @{Url = "http://localhost/stats/reset"; Name = "Service C Reset"}
)

foreach ($endpoint in $endpoints) {
    Write-Host "Testing $($endpoint.Name) ..." -NoNewline
    try {
        if ($endpoint.Name -eq "Job Submit" -or $endpoint.Name -eq "Service C Reset") {
            $response = Invoke-WebRequest -Uri $endpoint.Url -Method POST -TimeoutSec 10
        } else {
            $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 10
        }
        Write-Host " SUCCESS ($($response.StatusCode))" -ForegroundColor Green
        if ($endpoint.Name -eq "Job Submit") {
            Write-Host "   Job ID: $($response.Content)" -ForegroundColor Gray
        }
    } catch {
        Write-Host " FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== HPA Status ===" -ForegroundColor Yellow
kubectl get hpa -n job-system