# Verify Classifier Health script (.ps1)
# Checks the Document Classification Review Tool stack for responsiveness.

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n[1/4] Checking System Connectivity..." -ForegroundColor Cyan
try {
    # Using 127.0.0.1 to avoid IPv6 resolution issues and targeting a JSON endpoint
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/config" -Method Get -TimeoutSec 5
    Write-Host "  Success: OCR Server (Flask) is responding at 127.0.0.1:5000." -ForegroundColor Green
}
catch {
    Write-Host "  Error: OCR Server is NOT responding at http://127.0.0.1:5000/api/config." -ForegroundColor Red
    Write-Host "  Exception: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "  Ensure 'python tools/ocr_server.py' is running." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[2/4] Checking UI Availability..." -ForegroundColor Cyan
$uiPath = "../tools/classifier/classifier-ui.html"
if (Test-Path $uiPath) {
    Write-Host "  Success: classifier-ui.html found." -ForegroundColor Green
}
else {
    Write-Host "  Error: UI file missing at $uiPath!" -ForegroundColor Red
}

Write-Host "`n[3/4] Testing Feedback API (Health Check)..." -ForegroundColor Cyan
try {
    $fbResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/feedback" -Method Get -TimeoutSec 5
    $entryCount = $fbResponse.entries.Count
    Write-Host "  Success: Feedback API is reachable." -ForegroundColor Green
    Write-Host "  Current Audit Log size: $entryCount records." -ForegroundColor Gray
}
catch {
    Write-Host "  Error: API endpoint /api/feedback is failing!" -ForegroundColor Red
}

Write-Host "`n[4/4] Finalizing Accuracy Totals..." -ForegroundColor Cyan
if ($fbResponse.summary) {
    $total = $fbResponse.summary.total
    $correct = $fbResponse.summary.correct
    $incorrect = $fbResponse.summary.incorrect
    Write-Host "  Total Reviewed : $total"
    Write-Host "  Correct Count  : $correct" -ForegroundColor Green
    Write-Host "  Incorrect Count: $incorrect" -ForegroundColor Red
}

Write-Host "`n--- Health Check Complete ---" -ForegroundColor Cyan
Write-Host "To run full unit tests, execute: pytest test_classifier_api.py" -ForegroundColor Gray
Write-Host ""
