$node = "C:\Users\rishi\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if (Test-Path $node) {
    Write-Host "Starting Downunder Bar KL server..." -ForegroundColor Green
    & $node server.js
} else {
    Write-Host "Playwright Node binary not found at $node. Attempting to use global 'node' command..." -ForegroundColor Yellow
    node server.js
}
