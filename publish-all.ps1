# Posty5 SDK Publish Script for PowerShell
# Run this script to publish all packages to npm

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Posty5 SDK - Publish All Packages" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if logged in to npm
Write-Host "Checking npm login status..." -ForegroundColor Yellow
$npmUser = npm whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to npm. Please run 'npm login' first." -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $npmUser" -ForegroundColor Green
Write-Host ""

# Define packages in publish order (core first, then others)
$packages = @(
    "posty5-core",
    "posty5-short-link",
    "posty5-qr-code",
    "posty5-html-hosting",
    "posty5-html-hosting-variables",
    "posty5-html-hosting-form-submission",
    "posty5-social-publisher-workspace",
    "posty5-social-publisher-task"
)

# Build all packages first
Write-Host "Building all packages..." -ForegroundColor Yellow
npm run build:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "All packages built successfully!" -ForegroundColor Green
Write-Host ""

# Publish each package
$published = @()
$failed = @()

foreach ($package in $packages) {
    Write-Host "Publishing $package..." -ForegroundColor Yellow
    
    Push-Location $package
    npm publish --access public 2>&1 | Tee-Object -Variable publishOutput
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Host "✓ $package published successfully!" -ForegroundColor Green
        $published += $package
    } else {
        Write-Host "✗ $package failed to publish!" -ForegroundColor Red
        $failed += $package
    }
    
    Write-Host ""
}

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Publish Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Successfully published: $($published.Count)" -ForegroundColor Green
foreach ($pkg in $published) {
    Write-Host "  ✓ $pkg" -ForegroundColor Green
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed to publish: $($failed.Count)" -ForegroundColor Red
    foreach ($pkg in $failed) {
        Write-Host "  ✗ $pkg" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please check the errors above and try again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host ""
    Write-Host "All packages published successfully! 🎉" -ForegroundColor Green
}
