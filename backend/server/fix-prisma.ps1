$files = @(
  "src\controllers\analytics.controller.js",
  "src\controllers\inventory.controller.js",
  "src\controllers\settings.controller.js",
  "src\controllers\translation.controller.js",
  "src\controllers\landing-page.controller.js",
  "src\controllers\hero.controller.js",
  "src\controllers\customer-group.controller.js",
  "src\controllers\damage.controller.js",
  "src\services\contentTranslation.service.js"
)

$base = "D:\mahbub-shop\backend\server"

foreach ($f in $files) {
  $path = Join-Path $base $f
  if (Test-Path $path) {
    $content = Get-Content $path -Raw -Encoding UTF8
    # Remove the @prisma/client require line
    $content = $content -replace "const \{ PrismaClient \} = require\('@prisma/client'\);\r?\n", ""
    # Replace bare new PrismaClient() with shared import
    $content = $content -replace "const prisma = new PrismaClient\(\);", "const prisma = require('../config/prisma');"
    Set-Content $path $content -NoNewline -Encoding UTF8
    Write-Host "Fixed: $f"
  } else {
    Write-Host "NOT FOUND: $f"
  }
}
Write-Host "Done."
