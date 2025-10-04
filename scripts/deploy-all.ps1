param(
    [string]$DockerHubUsername = "nikhilmindfire",
    [switch]$SkipImageBuild = $false,
    [switch]$SkipMonitoring = $false
)

Write-Host "🚀 MICROSERVICES AUTOMATED DEPLOYMENT" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# Function to execute commands with error handling
function Invoke-CommandWithStatus {
    param($Command, $Description)
    Write-Host "`n▶ $Description..." -ForegroundColor Yellow -NoNewline
    try {
        Invoke-Expression $Command *>&1 | Out-Null
        Write-Host " ✅" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Step 1: Build and Push Docker Images
if (-not $SkipImageBuild) {
    Write-Host "`n📦 BUILDING DOCKER IMAGES" -ForegroundColor Cyan
    
    $services = @("service-a", "service-b", "service-c")
    foreach ($service in $services) {
        $imageName = "$DockerHubUsername/$service"
        $dockerfilePath = ".\$service\Dockerfile"
        
        if (Test-Path $dockerfilePath) {
            Write-Host "  Building $service..." -ForegroundColor Yellow -NoNewline
            docker build -t $imageName -f $dockerfilePath . 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
                
                Write-Host "  Pushing $imageName..." -ForegroundColor Yellow -NoNewline
                docker push $imageName 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host " ✅" -ForegroundColor Green
                } else {
                    Write-Host " ⚠️ (Push failed, using local image)" -ForegroundColor Yellow
                }
            } else {
                Write-Host " ❌" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ Dockerfile not found for $service" -ForegroundColor Red
        }
    }
}

# Step 2: Create Namespace
Write-Host "`n🏗️  SETTING UP KUBERNETES" -ForegroundColor Cyan
Invoke-CommandWithStatus -Command "kubectl create namespace job-system --dry-run=client -o yaml | kubectl apply -f -" -Description "Creating namespace"

# Step 3: Deploy Microservices
Write-Host "`n🔧 DEPLOYING MICROSERVICES" -ForegroundColor Cyan

$manifests = @(
    "k8s/namespace.yaml",
    "k8s/redis.yaml", 
    "k8s/service-a.yaml",
    "k8s/service-b.yaml", 
    "k8s/service-c.yaml",
    "k8s/ingress.yaml",
    "k8s/hpa.yaml",
    "k8s/metrics-server.yaml"
)

foreach ($manifest in $manifests) {
    if (Test-Path $manifest) {
        $manifestName = Split-Path $manifest -Leaf
        Invoke-CommandWithStatus -Command "kubectl apply -f $manifest" -Description "Deploying $manifestName"
    } else {
        Write-Host "  ❌ Manifest not found: $manifest" -ForegroundColor Red
    }
}

# Step 4: Install Monitoring Stack
if (-not $SkipMonitoring) {
    Write-Host "`n📊 SETTING UP MONITORING" -ForegroundColor Cyan
    
    Invoke-CommandWithStatus -Command "helm repo add prometheus-community https://prometheus-community.github.io/helm-charts" -Description "Adding Helm repo"
    Invoke-CommandWithStatus -Command "helm repo update" -Description "Updating Helm repos"
    
    $helmCommand = @"
    helm install prometheus prometheus-community/kube-prometheus-stack `
        --namespace monitoring `
        --create-namespace `
        --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false `
        --set grafana.adminPassword=admin `
        --wait
"@
    Invoke-CommandWithStatus -Command $helmCommand -Description "Installing Prometheus Stack"
    
    # Apply ServiceMonitors
    if (Test-Path "k8s/service-monitor.yaml") {
        Invoke-CommandWithStatus -Command "kubectl apply -f k8s/service-monitor.yaml" -Description "Configuring ServiceMonitors"
    }
}

# Step 5: Wait for Deployment
Write-Host "`n⏳ WAITING FOR DEPLOYMENT TO BE READY" -ForegroundColor Cyan

$timeout = 300
$startTime = Get-Date
$allReady = $false

do {
    $pods = kubectl get pods -n job-system -o json | ConvertFrom-Json
    $readyPods = 0
    $totalPods = 0
    
    foreach ($pod in $pods.items) {
        $totalPods++
        $isReady = $true
        foreach ($container in $pod.status.containerStatuses) {
            if (-not $container.ready) {
                $isReady = $false
                break
            }
        }
        if ($isReady) { $readyPods++ }
    }
    
    Write-Host "  Pods ready: $readyPods/$totalPods" -ForegroundColor Yellow
    if ($readyPods -eq $totalPods -and $totalPods -gt 0) {
        $allReady = $true
        break
    }
    
    Start-Sleep -Seconds 10
} while ((Get-Date).Subtract($startTime).TotalSeconds -lt $timeout)

# Step 6: Final Status
Write-Host "`n🎯 DEPLOYMENT STATUS" -ForegroundColor Cyan
kubectl get all -n job-system

if (-not $SkipMonitoring) {
    Write-Host "`n📈 MONITORING STATUS" -ForegroundColor Cyan
    kubectl get pods -n monitoring
}

Write-Host "`n🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\test-system.ps1" -ForegroundColor White
Write-Host "2. Run: .\start-monitoring.ps1" -ForegroundColor White
Write-Host "3. Run: .\stress-test.ps1" -ForegroundColor White