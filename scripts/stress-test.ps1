param(
    [int]$JobCount = 100,
    [int]$Concurrency = 3,
    [int]$PrimeMax = 50000
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "STRESS TEST" -ForegroundColor Red
Write-Host "==============" -ForegroundColor Cyan

Write-Host "Parameters: Jobs=$JobCount, Concurrency=$Concurrency, PrimeMax=$PrimeMax" -ForegroundColor Yellow

# Start port-forwarding
Write-Host "`nStarting port-forwarding..." -ForegroundColor Yellow
$portForwardJob = Start-Job -ScriptBlock { 
    param($ns, $svc, $lp, $sp)
    kubectl port-forward -n $ns service/$svc "$lp`:$sp" --address 127.0.0.1
} -ArgumentList "job-system", "service-a", 8080, 5001 | Out-Null
Start-Sleep -Seconds 10  # Wait for port-forwarding stability

Write-Host "`nSubmitting $JobCount jobs..." -ForegroundColor Green
$success = 0
$errors = 0
$jobs = @()
$processedJobs = @{}  # Track processed job IDs to prevent double-counting

# Submit jobs with concurrency control
for ($i = 1; $i -le $JobCount; $i++) {
    # Wait for available slots if concurrency limit is reached
    while ((Get-Job -State Running | Where-Object { $_.Command -notlike "*port-forward*" } | Measure-Object).Count -ge $Concurrency) {
        Start-Sleep -Milliseconds 500
        Get-Job -State Completed | ForEach-Object { 
            if ($_.Command -like "*port-forward*") { continue }
            $jobId = $_.Id
            if ($processedJobs.ContainsKey($jobId)) { continue }  # Skip already processed jobs
            $jobResult = Receive-Job -Job $_ -Keep
            $processedJobs[$jobId] = $true
            if ($jobResult.Success) {
                $success++
                Write-Host "Job $i succeeded: $($jobResult.JobId)" -ForegroundColor Green
            } else {
                $errors++
                Write-Host "Job $i failed: $($jobResult.Error)" -ForegroundColor Red
            }
            Remove-Job -Job $_
        }
    }

    # Submit a job with retry logic
    $jobs += Start-Job -ScriptBlock {
        param($primeMax, $index)
        $retries = 3
        for ($j = 1; $j -le $retries; $j++) {
            try {
                $body = @{
                    type = "prime_calculation"
                    data = @{ max = $primeMax }
                } | ConvertTo-Json
                $result = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 15
                return @{ Success = $true; JobId = $result.jobId; Index = $index }
            } catch {
                if ($j -eq $retries) {
                    return @{ Success = $false; Error = $_.Exception.Message; Index = $index }
                }
                if ($_.Exception.Message -like "*429*") {
                    Start-Sleep -Seconds 3
                } else {
                    Start-Sleep -Seconds 2
                }
            }
        }
    } -ArgumentList $PrimeMax, $i

    if ($i % 20 -eq 0) {
        Write-Host "Submitted $i jobs..." -ForegroundColor Yellow
    }
}

# Wait for remaining jobs with timeout
Write-Host "`nWaiting for remaining jobs to complete..." -ForegroundColor Yellow
$timeoutSeconds = 300  # 5-minute timeout
Get-Job | Where-Object { $_.Command -notlike "*port-forward*" } | Wait-Job -Timeout $timeoutSeconds | ForEach-Object {
    $jobId = $_.Id
    if ($processedJobs.ContainsKey($jobId)) { continue }  # Skip already processed jobs
    $jobResult = Receive-Job -Job $_ -Keep
    $processedJobs[$jobId] = $true
    if ($jobResult.Success) {
        $success++
        Write-Host "Job $($jobResult.Index) succeeded: $($jobResult.JobId)" -ForegroundColor Green
    } else {
        $errors++
        Write-Host "Job $($jobResult.Index) failed: $($jobResult.Error)" -ForegroundColor Red
    }
    Remove-Job -Job $_
}

# Check for timed-out jobs
Get-Job -State Running | Where-Object { $_.Command -notlike "*port-forward*" } | ForEach-Object {
    Write-Host "Job $($_.Id) timed out after $timeoutSeconds seconds" -ForegroundColor Red
    $errors++
    Stop-Job -Job $_
    Remove-Job -Job $_
}

Write-Host "`nResults: $success successful, $errors errors" -ForegroundColor Cyan

# Show HPA status
Write-Host "`n[HPA] HPA Status:" -ForegroundColor Yellow
kubectl get hpa -n job-system

# Cleanup
Write-Host "`nCleaning up..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

Write-Host "`nSTRESS TEST COMPLETE" -ForegroundColor Green

# param(
#     [int]$JobCount = 100,
#     [int]$Concurrency = 10,
#     [int]$PrimeMax = 50000
# )

# [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# Write-Host "STRESS TEST" -ForegroundColor Red
# Write-Host "==============" -ForegroundColor Cyan

# Write-Host "Parameters: Jobs=$JobCount, Concurrency=$Concurrency, PrimeMax=$PrimeMax" -ForegroundColor Yellow

# # Start port-forwarding
# Write-Host "`nStarting port-forwarding..." -ForegroundColor Yellow
# $portForwardJob = Start-Job -ScriptBlock { 
#     param($ns, $svc, $lp, $sp)
#     kubectl port-forward -n $ns service/$svc "$lp`:$sp"
# } -ArgumentList "job-system", "service-a", 8080, 5001 | Out-Null
# Start-Sleep -Seconds 5  # Wait for port-forwarding to establish

# Write-Host "`nSubmitting $JobCount jobs..." -ForegroundColor Green
# $success = 0
# $errors = 0
# $jobs = @()

# # Submit jobs with concurrency control
# for ($i = 1; $i -le $JobCount; $i++) {
#     # Wait for available slots if concurrency limit is reached
#     while ((Get-Job -State Running | Measure-Object).Count -ge $Concurrency) {
#         Start-Sleep -Milliseconds 500
#         Get-Job -State Completed | ForEach-Object { 
#             $jobResult = Receive-Job -Job $_ -Keep
#             if ($jobResult.Success) {
#                 $success++
#             } else {
#                 $errors++
#                 if ($jobResult.Error -like "*429*") {
#                     Start-Sleep -Seconds 1
#                 }
#             }
#             Remove-Job -Job $_
#         }
#     }

#     # Submit a job
#     $jobs += Start-Job -ScriptBlock {
#         param($primeMax)
#         try {
#             $body = @{
#                 type = "prime_calculation"
#                 data = @{ max = $primeMax }
#             } | ConvertTo-Json
#             Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 | Out-Null
#             return @{ Success = $true }
#         } catch {
#             return @{ Success = $false; Error = $_.Exception.Message }
#         }
#     } -ArgumentList $PrimeMax

#     if ($i % 20 -eq 0) {
#         Write-Host "Submitted $i jobs..." -ForegroundColor Yellow
#     }
# }

# # Wait for remaining jobs to complete
# Write-Host "`nWaiting for remaining jobs to complete..." -ForegroundColor Yellow
# Get-Job | Wait-Job | ForEach-Object {
#     $jobResult = Receive-Job -Job $_ -Keep
#     if ($jobResult.Success) {
#         $success++
#     } else {
#         $errors++
#         if ($jobResult.Error -like "*429*") {
#             Start-Sleep -Seconds 1
#         }
#     }
#     Remove-Job -Job $_
# }

# Write-Host "`nResults: $success successful, $errors errors" -ForegroundColor Cyan

# # Show HPA status
# Write-Host "`n⚡ HPA Status:" -ForegroundColor Yellow
# kubectl get hpa -n job-system

# # Cleanup
# Write-Host "`nCleaning up..." -ForegroundColor Yellow
# Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

# Write-Host "`nSTRESS TEST COMPLETE" -ForegroundColor Green

# param(
#     [int]$JobCount = 100,
#     [int]$Concurrency = 10,
#     [int]$PrimeMax = 50000
# )

# Write-Host "STRESS TEST" -ForegroundColor Red
# Write-Host "==============" -ForegroundColor Cyan

# Write-Host "Parameters: Jobs=$JobCount, Concurrency=$Concurrency, PrimeMax=$PrimeMax" -ForegroundColor Yellow

# # Start port forwarding
# kubectl port-forward -n job-system service/service-a 8080:5001 -Background | Out-Null
# Start-Sleep -Seconds 3

# Write-Host "`n Submitting $JobCount jobs..." -ForegroundColor Green
# $success = 0
# $errors = 0

# for ($i = 1; $i -le $JobCount; $i++) {
#     try {
#         $body = @{
#             type = "prime_calculation"
#             data = @{ max = $PrimeMax }
#         } | ConvertTo-Json
        
#         Invoke-RestMethod -Uri "http://localhost:8080/api/v1/job/submit" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 | Out-Null
#         $success++
        
#         if ($i % 20 -eq 0) {
#             Write-Host "Submitted $i jobs..." -ForegroundColor Yellow
#         }
#     } catch {
#         $errors++
#         if ($_.Exception.Message -like "*429*") {
#             Start-Sleep -Seconds 1
#         }
#     }
# }

# Write-Host "`n Results: $success successful, $errors errors" -ForegroundColor Cyan

# # Show HPA status
# Write-Host "`n⚡ HPA Status:" -ForegroundColor Yellow
# kubectl get hpa -n job-system

# # Cleanup
# Get-Job | Where-Object { $_.Command -like "*port-forward*" } | Stop-Job | Remove-Job

# Write-Host "`n STRESS TEST COMPLETE" -ForegroundColor Green