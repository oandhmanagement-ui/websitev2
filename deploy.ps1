# PowerShell Script für Netlify Deployment

Write-Host "Starting Netlify deployment..." -ForegroundColor Green

# 1) NPX-Cache aufräumen
Write-Host "Cleaning NPX cache..." -ForegroundColor Yellow
Remove-Item "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Force -ErrorAction SilentlyContinue

# 2) Netlify Login
Write-Host "Logging in to Netlify..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npx.cmd" --yes netlify-cli@latest login

# 3) Site initialisieren
Write-Host "Initializing site..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npx.cmd" --yes netlify-cli@latest init

# 4) Environment Variables setzen
Write-Host "Setting environment variables..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npx.cmd" --yes netlify-cli@latest env:set OPENAI_API_KEY "REPLACE_WITH_API_KEY"
& "C:\Program Files\nodejs\npx.cmd" --yes netlify-cli@latest env:set MODEL "gpt-4o-mini"

# 5) Deploy
Write-Host "Deploying to production..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npx.cmd" --yes netlify-cli@latest deploy --build --prod

Write-Host "Deployment complete!" -ForegroundColor Green
Read-Host "Press Enter to continue..."
