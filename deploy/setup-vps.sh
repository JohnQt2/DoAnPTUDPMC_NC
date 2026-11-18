#!/usr/bin/env bash
# =====================================================================
# Chạy MỘT LẦN trên VPS Ubuntu 24.04 (user root):
#   cd /root/deploy && bash setup-vps.sh email_cua_ban@gmail.com
# Email dùng để đăng ký SSL Let's Encrypt.
# =====================================================================
set -euo pipefail

EMAIL="${1:-}"
APP_ROOT=/var/www/hanzi4u
DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$EMAIL" ]; then
    echo "Thiếu email. Dùng: bash setup-vps.sh email@gmail.com"; exit 1
fi

echo "==> [1/8] Cập nhật hệ thống & cài gói cơ bản"
apt-get update
apt-get install -y curl git rsync nginx ufw fontconfig openjdk-21-jre certbot python3-certbot-nginx

echo "==> [2/8] Cài Node.js 22 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> [3/8] Cài Jenkins"
mkdir -p /etc/apt/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key -o /etc/apt/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
    > /etc/apt/sources.list.d/jenkins.list
apt-get update
apt-get install -y jenkins
systemctl enable --now jenkins

echo "==> [4/8] Tạo thư mục ứng dụng"
mkdir -p "$APP_ROOT"/backend "$APP_ROOT"/frontend "$APP_ROOT"/data
if [ ! -f "$APP_ROOT/backend/.env" ]; then
    cp "$DIR/.env.production.example" "$APP_ROOT/backend/.env"
    sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=\"$(openssl rand -hex 48)\"|"   "$APP_ROOT/backend/.env"
    sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=\"$(openssl rand -hex 48)\"|" "$APP_ROOT/backend/.env"
fi
chown -R jenkins:jenkins "$APP_ROOT"
chmod 600 "$APP_ROOT/backend/.env"

echo "==> [5/8] Service cho backend + quyền restart cho Jenkins"
cp "$DIR/hanzi4u-api.service" /etc/systemd/system/hanzi4u-api.service
systemctl daemon-reload
systemctl enable hanzi4u-api
cat > /etc/sudoers.d/jenkins-hanzi4u <<'EOF'
jenkins ALL=(root) NOPASSWD: /usr/bin/systemctl restart hanzi4u-api, /usr/bin/systemctl status hanzi4u-api *
EOF
chmod 440 /etc/sudoers.d/jenkins-hanzi4u
visudo -cf /etc/sudoers.d/jenkins-hanzi4u

echo "==> [6/8] Cấu hình Nginx"
cp "$DIR/nginx-hanzi4u.conf" /etc/nginx/sites-available/hanzi4u
ln -sf /etc/nginx/sites-available/hanzi4u /etc/nginx/sites-enabled/hanzi4u
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> [7/8] Firewall (chỉ mở SSH, 80, 443)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> [8/8] Xin SSL Let's Encrypt"
certbot --nginx --non-interactive --agree-tos --redirect -m "$EMAIL" \
    -d hanzi4u.id.vn -d www.hanzi4u.id.vn -d jenkins.hanzi4u.id.vn

echo ""
echo "======================================================"
echo " XONG! Mở https://jenkins.hanzi4u.id.vn"
echo " Mật khẩu admin Jenkins ban đầu:"
cat /var/lib/jenkins/secrets/initialAdminPassword || true
echo "======================================================"

