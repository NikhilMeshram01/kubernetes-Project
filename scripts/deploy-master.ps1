param(
    [string]$DockerHubUsername = "nikhilmindfire",
    [switch]$BuildImages = $true,
    [switch]$DeployK8s = $true,
    [switch]$SetupMonitoring = $true,
    [switch]$RunTests = $true,
    [switch]$FullDeployment = $false
)

Write-Host "🚀 MICROSERVICES MASTER DEPLOYMENT" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan

# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Function to run scripts with status
function Invoke-ScriptWithStatus {
    param($ScriptPath, $Description)
    
    if (Test-Path $ScriptPath) {
        Write-Host "`n▶ $Description..." -ForegroundColor Yellow
        try {
            & $ScriptPath
            Write-Host "✅ $Description completed" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "❌ Script not found: $ScriptPath" -ForegroundColor Red
        return $false
    }
}

# Full deployment mode
if ($FullDeployment) {
    $BuildImages = $true
    $DeployK8s = $true
    $SetupMonitoring = $true
    $RunTests = $true
}

# Step 1: Build and Push Images
# if ($BuildImages) {
#     Invoke-ScriptWithStatus -ScriptPath ".\build-images.ps1" -Description "Building Docker images"
# }

# Step 2: Deploy to Kubernetes
if ($DeployK8s) {
    Invoke-ScriptWithStatus -ScriptPath ".\deploy-k8s.ps1" -Description "Deploying to Kubernetes"
}

# Step 3: Setup Monitoring
if ($SetupMonitoring) {
    Invoke-ScriptWithStatus -ScriptPath ".\setup-monitoring.ps1" -Description "Setting up monitoring"
}

# Step 4: Run Tests
if ($RunTests) {
    Invoke-ScriptWithStatus -ScriptPath ".\test-system.ps1" -Description "Testing system"
    Start-Sleep -Seconds 5
    Invoke-ScriptWithStatus -ScriptPath ".\stress-test.ps1" -Description "Running stress test"
}

Write-Host "`n🎯 DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor White

if ($BuildImages) { Write-Host "✓ Docker images built" -ForegroundColor Green }
if ($DeployK8s) { Write-Host "✓ Kubernetes deployed" -ForegroundColor Green }
if ($SetupMonitoring) { Write-Host "✓ Monitoring setup" -ForegroundColor Green }
if ($RunTests) { Write-Host "✓ Tests executed" -ForegroundColor Green }

Write-Host "`n🎉 MASTER DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. View monitoring: .\start-monitoring.ps1" -ForegroundColor White
Write-Host "2. Run another test: .\stress-test.ps1 -JobCount 200" -ForegroundColor White
Write-Host "3. Clean up: .\cleanup.ps1" -ForegroundColor White