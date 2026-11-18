// =====================================================================
// CI/CD pipeline: GitHub -> Jenkins (chạy trên VPS Windows) -> hanzi4u.id.vn
// Agent: chính VPS Windows Server (Jenkins cài dạng Windows Service)
// =====================================================================
pipeline {
    agent any

    triggers {
        githubPush()          // GitHub webhook -> https://jenkins.hanzi4u.id.vn/github-webhook/
    }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        APP_ROOT     = 'C:\\hanzi4u'                 // thư mục chạy thật trên VPS
        API_SERVICE  = 'hanzi4u-api'                 // tên Windows service (NSSM)
        HEALTH_URL   = 'http://localhost:5000/api/v1/health'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                    bat 'npx prisma generate'
                    bat 'npm run build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    bat 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                powershell '''
                    $ErrorActionPreference = "Stop"
                    $root = $env:APP_ROOT

                    function Mirror($src, $dst) {
                        robocopy $src $dst /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
                        if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $src -> $dst ($LASTEXITCODE)" }
                        $global:LASTEXITCODE = 0
                    }

                    Write-Host "==> Stop API service"
                    nssm stop $env:API_SERVICE | Out-Null

                    Write-Host "==> Copy backend"
                    Mirror "backend\\dist"         "$root\\backend\\dist"
                    Mirror "backend\\node_modules" "$root\\backend\\node_modules"
                    Mirror "backend\\prisma"       "$root\\backend\\prisma"
                    Copy-Item "backend\\package.json" "$root\\backend\\" -Force

                    Write-Host "==> Sync database schema"
                    Push-Location "$root\\backend"
                    npx prisma db push --skip-generate
                    if ($LASTEXITCODE -ne 0) { throw "prisma db push failed" }
                    Pop-Location

                    Write-Host "==> Start API service"
                    nssm start $env:API_SERVICE | Out-Null

                    Write-Host "==> Copy frontend"
                    Mirror "frontend\\dist" "$root\\frontend"
                '''
            }
        }

        stage('Health check') {
            steps {
                powershell '''
                    for ($i = 1; $i -le 10; $i++) {
                        try {
                            $r = Invoke-WebRequest -UseBasicParsing $env:HEALTH_URL -TimeoutSec 5
                            if ($r.StatusCode -eq 200) { Write-Host "API healthy"; exit 0 }
                        } catch { Start-Sleep -Seconds 3 }
                    }
                    throw "API không phản hồi sau khi deploy"
                '''
            }
        }
    }

    post {
        success { echo 'Deploy thành công -> https://hanzi4u.id.vn' }
        failure { echo 'Build/Deploy thất bại, xem Console Output.' }
    }
}
