Write-Host "📊 STARTING MONITORING" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Cyan

# Start Grafana port forwarding
Write-Host "`nStarting Grafana..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
} | Out-Null

# Start Prometheus port forwarding  
Start-Job -ScriptBlock {
    kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
} | Out-Null

Write-Host "✅ Monitoring dashboards started:" -ForegroundColor Green
Write-Host "   Grafana:    http://localhost:3000" -ForegroundColor White
Write-Host "   Username:   admin" -ForegroundColor White  
Write-Host "   Password:   admin" -ForegroundColor White
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White

Write-Host "`nTo stop monitoring, run: .\stop-monitoring.ps1" -ForegroundColor Yellow