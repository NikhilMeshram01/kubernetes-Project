# Write-Host "BUILDING DOCKER IMAGES" -ForegroundColor Green
# Write-Host "=========================" -ForegroundColor Cyan

# $services = @("service-a", "service-b", "service-c")

# foreach ($service in $services) {
#     $servicePath = "..\$service"
#     $dockerfilePath = "$servicePath\Dockerfile"
    
#     if (Test-Path $dockerfilePath) {
#         Write-Host "Building $service..." -ForegroundColor Yellow -NoNewline
        
#         # Build image
#         Set-Location $servicePath
#         docker build -t nikhilmindfire/$service . 2>&1 | Out-Null
        
#         if ($LASTEXITCODE -eq 0) {
#             Write-Host " SUCCESS" -ForegroundColor Green
            
#             # Push image
#             Write-Host "Pushing nikhilmindfire/$service..." -ForegroundColor Yellow -NoNewline
#             docker push nikhilmindfire/$service 2>&1 | Out-Null
#             if ($LASTEXITCODE -eq 0) {
#                 Write-Host " SUCCESS" -ForegroundColor Green
#             } else {
#                 Write-Host " WARNING" -ForegroundColor Yellow
#             }
#         } else {
#             Write-Host " FAILED" -ForegroundColor Red
#         }
        
#         Set-Location "..\scripts"
#     } else {
#         Write-Host "Dockerfile not found for $service" -ForegroundColor Red
#     }
# }

# Write-Host "`nIMAGE BUILDING COMPLETE" -ForegroundColor Green

Write-Host "BUILDING DOCKER IMAGES" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan

# Get the script's directory for reliable relative paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Script directory: $scriptDir" -ForegroundColor Cyan

$services = @("service_a", "service_b", "service_c")

foreach ($service in $services) {
    $servicePath = Join-Path -Path $scriptDir -ChildPath ".." | Join-Path -ChildPath $service
    $dockerfilePath = Join-Path -Path $servicePath -ChildPath "Dockerfile"
    
    Write-Host "Checking Dockerfile: $dockerfilePath" -ForegroundColor Cyan
    
    if (Test-Path $dockerfilePath) {
        Write-Host "Building $service..." -ForegroundColor Yellow -NoNewline
        
        # Build image
        Write-Host "Changing to directory: $servicePath" -ForegroundColor Cyan
        Set-Location $servicePath
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
        docker build -t nikhilmindfire/$service . 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " SUCCESS" -ForegroundColor Green
            
            # Push image
            Write-Host "Pushing nikhilmindfire/$service..." -ForegroundColor Yellow -NoNewline
            docker push nikhilmindfire/$service 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " SUCCESS" -ForegroundColor Green
            } else {
                Write-Host " WARNING" -ForegroundColor Yellow
            }
        } else {
            Write-Host " FAILED" -ForegroundColor Red
        }
        
        # Return to script directory
        Write-Host "Returning to: $scriptDir" -ForegroundColor Cyan
        Set-Location $scriptDir
    } else {
        Write-Host "Dockerfile not found for $service at $dockerfilePath" -ForegroundColor Red
    }
}

Write-Host "`nIMAGE BUILDING COMPLETE" -ForegroundColor Green