#!/usr/bin/env bash
set -euo pipefail

log() { echo -e "\n\033[1;34m==>\033[0m $1"; }

log "Installing Node 20"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

log "Installing Chromium runtime deps + git"
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates fonts-liberation git openssl \
  libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libpango-1.0-0 libcairo2 libnspr4 libcups2 libatk1.0-0 libgtk-3-0 \
  libxshmfence1 libxss1 || true
apt-get install -y libasound2t64 || apt-get install -y libasound2 || true

log "Cloning / updating repo"
mkdir -p /opt
cd /opt
if [ -d cv-tailor/.git ]; then
  cd cv-tailor && git fetch --all && git reset --hard origin/main
else
  git clone https://github.com/kmpawlik/cv-tailor.git
  cd cv-tailor
fi

log "Installing npm deps"
npm ci

log "Installing browsers"
npx --yes puppeteer browsers install chrome
PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright npx --yes playwright install chromium

log "Building"
npm run build

log "Setting up env"
mkdir -p /opt/cv-tailor/data
if [ ! -f /opt/cv-tailor/.env.local ]; then
  cat > /opt/cv-tailor/.env.local <<EOF
APP_PASSWORD=kamiluj123
SESSION_SECRET=$(openssl rand -hex 32)
ANTHROPIC_API_KEY=REPLACE_ME
DATA_DIR=/opt/cv-tailor/data
NODE_ENV=production
PORT=3200
EOF
  echo "Created /opt/cv-tailor/.env.local"
else
  echo "Existing .env.local kept"
fi

log "Installing systemd unit"
cat > /etc/systemd/system/cv-tailor.service <<'EOF'
[Unit]
Description=CV Tailor
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/cv-tailor
EnvironmentFile=/opt/cv-tailor/.env.local
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cv-tailor
systemctl restart cv-tailor
sleep 3

log "Opening port 3200 in ufw (if active)"
ufw allow 3200/tcp 2>/dev/null || true

log "Status"
systemctl status cv-tailor --no-pager | head -15 || true

IP=$(curl -s ifconfig.me || echo "116.203.136.77")
cat <<EOM

============================================================
DONE

  URL:      http://${IP}:3200
  Password: kamiluj123

  Set your Claude API key:
    nano /opt/cv-tailor/.env.local
    (replace REPLACE_ME with your sk-ant-... key)
    systemctl restart cv-tailor

  Logs: journalctl -u cv-tailor -f
============================================================
EOM
