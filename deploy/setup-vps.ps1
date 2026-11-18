# =====================================================================
# Chạy MỘT LẦN trên VPS Windows Server (PowerShell "Run as Administrator")
#   Set-ExecutionPolicy Bypass -Scope Process -Force; .\setup-vps.ps1
# =====================================================================
$ErrorActionPreference = "Stop"

# 1. Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-Expression ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:Path += ";$env:ProgramData\chocolatey\bin"
}

# 2. Phần mềm cần thiết
choco install -y git nodejs-lts temurin21 nssm caddy
choco install -y jenkins          # Jenkins LTS, chạy dạng Windows Service ở cổng 8080
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine")

# 3. Thư mục ứng dụng
New-Item -ItemType Directory -Force -Path C:\hanzi4u\backend, C:\hanzi4u\frontend, C:\hanzi4u\data, C:\hanzi4u\logs, C:\caddy | Out-Null

# 4. Service cho backend Node (NSSM)
$node = (Get-Command node).Source
nssm install hanzi4u-api $node "dist\server.js"
nssm set hanzi4u-api AppDirectory C:\hanzi4u\backend
nssm set hanzi4u-api AppEnvironmentExtra NODE_ENV=production
nssm set hanzi4u-api AppStdout C:\hanzi4u\logs\api.out.log
nssm set hanzi4u-api AppStderr C:\hanzi4u\logs\api.err.log
nssm set hanzi4u-api AppRotateFiles 1
nssm set hanzi4u-api Start SERVICE_AUTO_START

# 5. Service cho Caddy (reverse proxy + HTTPS). Cần copy deploy\Caddyfile -> C:\caddy\Caddyfile trước khi start
$caddy = (Get-Command caddy).Source
nssm install caddy $caddy "run --config C:\caddy\Caddyfile --adapter caddyfile"
nssm set caddy AppDirectory C:\caddy
nssm set caddy Start SERVICE_AUTO_START

# 6. Firewall: mở 80/443 (Jenkins 8080 chỉ truy cập qua Caddy, không mở ra ngoài)
New-NetFirewallRule -DisplayName "HTTP 80"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue

# 7. Restart Jenkins để nhận PATH mới (git, node, npm, nssm)
Restart-Service jenkins

Write-Host ""
Write-Host "Xong. Mật khẩu admin Jenkins ban đầu:"
Get-Content "C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword" -ErrorAction SilentlyContinue

