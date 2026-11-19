// =====================================================================
// CI/CD: GitHub push -> Jenkins (trên VPS Ubuntu 24.04) -> https://hanzi4u.id.vn
// =====================================================================
pipeline {
    agent any

    triggers {
        githubPush()   // webhook: https://jenkins.hanzi4u.id.vn/github-webhook/
    }

    options {
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    environment {
        APP_ROOT    = '/var/www/hanzi4u'
        API_SERVICE = 'hanzi4u-api'
        HEALTH_URL  = 'http://127.0.0.1:5000/api/v1/health'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    echo "==> Copy backend"
                    rsync -a --delete backend/dist/         "$APP_ROOT/backend/dist/"
                    rsync -a --delete backend/node_modules/ "$APP_ROOT/backend/node_modules/"
                    rsync -a --delete backend/prisma/       "$APP_ROOT/backend/prisma/"
                    cp backend/package.json "$APP_ROOT/backend/"

                    echo "==> Sync database schema"
                    cd "$APP_ROOT/backend"
                    npx prisma db push --skip-generate
                    cd -

                    echo "==> Restart API"
                    sudo /usr/bin/systemctl restart "$API_SERVICE"

                    echo "==> Copy frontend"
                    rsync -a --delete frontend/dist/ "$APP_ROOT/frontend/"
                '''
            }
        }

        stage('Health check') {
            steps {
                sh '''
                    for i in $(seq 1 10); do
                        if curl -fsS "$HEALTH_URL" > /dev/null; then
                            echo "API healthy"; exit 0
                        fi
                        sleep 3
                    done
                    echo "API không phản hồi sau khi deploy"
                    sudo /usr/bin/systemctl status "$API_SERVICE" --no-pager || true
                    exit 1
                '''
            }
        }
    }

    post {
        success { echo 'Deploy thành công -> https://hanzi4u.id.vn' }
        failure { echo 'Build/Deploy thất bại, xem Console Output.' }
    }
}
