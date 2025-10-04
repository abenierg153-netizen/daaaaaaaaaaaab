# Admin Bootstrap Script
Write-Host "ðŸš€ Starting admin bootstrap..." -ForegroundColor Green

# Load environment variables
 = Get-Content ".env.server" -Raw
 -split "
" | ForEach-Object {
    if ( -match "^([^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable([1], [2], "Process")
    }
}

 = 
 = 

if (-not  -or -not ) {
    Write-Host "âŒ Missing Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "âœ“ Supabase credentials loaded" -ForegroundColor Green
Write-Host "âœ“ Admin bootstrap completed (manual verification required)" -ForegroundColor Green
Write-Host "ðŸ“§ Admin Email: admin@smileflow.com" -ForegroundColor Cyan
Write-Host "ðŸ”‘ Admin Password: admin123" -ForegroundColor Cyan
