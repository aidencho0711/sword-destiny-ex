# ══════════════════════════════════════════════════════════════════
#  Sword Destiny - ex  →  Netlify 자동 배포
#
#  하는 일: 배포할 파일만 골라 zip으로 압축한 뒤, Netlify API로 올려
#           같은 사이트에 새 버전을 배포하고 최종 URL을 출력합니다.
#           (Netlify Drop 페이지에 드래그하던 작업을 한 번의 실행으로 대체)
#
#  필요한 것: 외부 프로그램 설치 불필요 (Windows PowerShell 내장 기능만 사용).
#             단, 최초 1회 Netlify 개인 액세스 토큰이 필요합니다.
#
#  쓰는 법:
#    1) https://app.netlify.com/user/applications  에서
#       "Personal access tokens" → "New access token" 으로 토큰을 발급.
#    2) 발급한 토큰을 이 폴더의 .netlify-token 파일에 한 줄로 저장.
#       (또는 환경변수 NETLIFY_AUTH_TOKEN 에 넣어도 됩니다)
#    3) 이 폴더에서 실행:   powershell -ExecutionPolicy Bypass -File deploy.ps1
#
#  최초 실행 시 새 사이트를 자동 생성하고 그 ID를 .netlify-site 에 저장합니다.
#  이후 실행부터는 같은 사이트(같은 URL)에 덮어쓰기 배포됩니다.
# ══════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

# 배포할 사이트 이름 (= 주소의 앞부분).  sword-destiny-ex → sword-destiny-ex.netlify.app
# 최초 실행 때 이 이름으로 계정에 이미 있는 사이트를 찾아 그 사이트에 덮어쓴다.
$SITE_NAME = "sword-destiny-ex"

# ── 배포에 포함할 파일/폴더 (sw.js 의 ASSETS 와 일치) ──
$include = @(
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "css",
    "js",
    "icon.svg",
    "icon-192.png",
    "icon-512.png",
    "icon-512-maskable.png"
)

# ── 1. 토큰 읽기 (환경변수 우선, 없으면 .netlify-token 파일) ──
$token = $env:NETLIFY_AUTH_TOKEN
if ([string]::IsNullOrWhiteSpace($token) -and (Test-Path ".netlify-token")) {
    $token = (Get-Content ".netlify-token" -Raw).Trim()
}
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "[오류] Netlify 토큰을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "       https://app.netlify.com/user/applications 에서 토큰을 발급한 뒤"
    Write-Host "       이 폴더에 .netlify-token 파일로 저장하거나 환경변수 NETLIFY_AUTH_TOKEN 에 넣으세요."
    exit 1
}
$headers = @{ Authorization = "Bearer $token" }

# ── 2. 배포 파일 존재 확인 ──
$missing = $include | Where-Object { -not (Test-Path $_) }
if ($missing) {
    Write-Host "[오류] 배포 대상 파일이 없습니다: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

# ── 2.5 캐시 버전 자동 증가 (sw.js) ──
#   서비스 워커 캐시 이름의 숫자를 +1 한다. 이렇게 해야 이미 방문한 기기가
#   옛 캐시를 버리고 이번에 올린 새 파일을 받는다. (zip 압축 전에 고쳐야 반영됨)
$swPath = Join-Path $PSScriptRoot "sw.js"
$sw = [System.IO.File]::ReadAllText($swPath, [System.Text.Encoding]::UTF8)
$m = [regex]::Match($sw, 'sworddestiny-v(\d+)')
if ($m.Success) {
    $newVer = [int]$m.Groups[1].Value + 1
    $sw = [regex]::Replace($sw, 'sworddestiny-v\d+', "sworddestiny-v$newVer")
    [System.IO.File]::WriteAllText($swPath, $sw, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "캐시 버전 → v$newVer" -ForegroundColor Cyan
} else {
    Write-Host "[경고] sw.js 에서 캐시 버전을 찾지 못해 그대로 배포합니다." -ForegroundColor Yellow
}

# ── 3. zip 압축 ──
#   주의: Windows 의 Compress-Archive 는 zip 내부 경로를 역슬래시로 써서
#   Netlify 가 하위 폴더를 인식하지 못한다. zip 표준인 정슬래시로 직접 넣는다.
$zip = Join-Path $PSScriptRoot "_deploy.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Write-Host "압축 중..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# 포함 목록을 실제 파일 경로로 펼친다 (폴더는 하위 전부)
$files = @()
foreach ($item in $include) {
    $p = Join-Path $PSScriptRoot $item
    if (Test-Path $p -PathType Container) {
        $files += Get-ChildItem $p -Recurse -File
    } else {
        $files += Get-Item $p
    }
}

$rootLen = $PSScriptRoot.TrimEnd('\').Length + 1
$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($rootLen).Replace('\', '/')   # 정슬래시로 통일
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $f.FullName, $rel,
            [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $archive.Dispose()
}
$sizeKB = [math]::Round((Get-Item $zip).Length / 1KB, 1)
Write-Host "  _deploy.zip 생성 ($($files.Count)개 파일, $sizeKB KB)"

# ── 4. 사이트 ID 확보 ──
#   .netlify-site 에 저장돼 있으면 그대로 쓰고,
#   없으면 $SITE_NAME 으로 계정에 이미 있는 사이트를 찾아 붙는다.
#   그래도 없으면 그 이름으로 새로 만든다.
$siteId = $null
if (Test-Path ".netlify-site") {
    $siteId = (Get-Content ".netlify-site" -Raw).Trim()
}
if ([string]::IsNullOrWhiteSpace($siteId)) {
    Write-Host "'$SITE_NAME' 사이트를 계정에서 찾는 중..." -ForegroundColor Cyan
    $sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites?per_page=100" `
        -Method Get -Headers $headers
    $match = $sites | Where-Object { $_.name -eq $SITE_NAME } | Select-Object -First 1
    if ($match) {
        $siteId = $match.id
        Set-Content ".netlify-site" $siteId -Encoding ascii
        Write-Host "  기존 사이트에 연결: $($match.ssl_url)  (ID 를 .netlify-site 에 저장)"
    } else {
        Write-Host "  같은 이름의 사이트가 없어 새로 생성합니다..." -ForegroundColor Cyan
        $body = @{ name = $SITE_NAME } | ConvertTo-Json
        $site = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" `
            -Method Post -Headers $headers -ContentType "application/json" -Body $body
        $siteId = $site.id
        Set-Content ".netlify-site" $siteId -Encoding ascii
        Write-Host "  생성됨: $($site.ssl_url)  (ID 를 .netlify-site 에 저장)"
    }
}

# ── 5. zip 을 Netlify 로 업로드 (배포) ──
Write-Host "업로드 중..." -ForegroundColor Cyan
$deploy = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/deploys" `
    -Method Post -Headers $headers -ContentType "application/zip" -InFile $zip

# ── 6. 결과 출력 ──
Remove-Item $zip -Force
$url = if ($deploy.ssl_url) { $deploy.ssl_url } else { $deploy.url }
Write-Host ""
Write-Host "✔ 배포 완료" -ForegroundColor Green
Write-Host "  상태 : $($deploy.state)"
Write-Host "  주소 : $url" -ForegroundColor Green
Write-Host ""
Write-Host "  (배포 처리는 몇 초 걸릴 수 있습니다. 위 주소를 새로고침하세요.)"
