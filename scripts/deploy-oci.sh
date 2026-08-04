#!/usr/bin/env bash
# Bootstrap / atualiza Allugue.me na OCI via SSH (mesmo fluxo do GitHub Actions).
# Uso: ./scripts/deploy-oci.sh
set -euo pipefail

OCI_KEY="${OCI_KEY:-/home/guelfi/Projetos/oci-key-2026-07-29}"
OCI_HOST="${OCI_HOST:-129.153.86.168}"
OCI_USER="${OCI_USER:-ubuntu}"
APP_DIR=/var/www/allugme
REPO_URL=https://github.com/guelfi/allugme.git

ssh -i "$OCI_KEY" -o StrictHostKeyChecking=no "${OCI_USER}@${OCI_HOST}" bash -s << EOF
set -euo pipefail
APP_DIR=$APP_DIR
REPO_URL=$REPO_URL

if [ ! -d "\$APP_DIR/.git" ]; then
  echo "Bootstrap: clonando \$REPO_URL em \$APP_DIR"
  sudo mkdir -p "\$APP_DIR"
  sudo chown -R "\$(whoami):\$(whoami)" "\$APP_DIR"
  git clone "\$REPO_URL" "\$APP_DIR"
fi

cd "\$APP_DIR"
git fetch origin
git reset --hard origin/main

if [ ! -f .env ]; then
  printf '%s\n' \\
    'VITE_API_URL=https://allugme.com.br/allugme/api/v1' \\
    'VITE_BASE_PATH=/allugme/' \\
    'POSTGRES_DB=allugme' \\
    'POSTGRES_USER=allugme' \\
    'POSTGRES_PASSWORD=allugme_oci_change_me' \\
    'Jwt__SigningKey=CHANGE_ME_OCI_Allugme_Jwt_Signing_Key_32chars+' \\
    'Seed__Enabled=true' \\
    'Seed__DemoData=true' \\
    'Seed__DemoPassword=Demo@123456' \\
    'Seed__SuperAdmin__Email=admin@allugme.com.br' \\
    'Seed__SuperAdmin__Password=Admin123#' \\
    'Swagger__Enabled=true' \\
    'Evolution__Enabled=false' \\
    > .env
fi

sudo docker network inspect www_projetos-net >/dev/null 2>&1 || sudo docker network create www_projetos-net
sudo docker compose --env-file .env up -d --build --remove-orphans
sudo docker network connect www_projetos-net allugme-api 2>/dev/null || true
sudo docker network connect www_projetos-net allugme-frontend 2>/dev/null || true
sudo docker network connect allugme_allugme-net nginx-proxy 2>/dev/null || true

if [ -f /var/www/nginx/nginx.conf ]; then
  sudo python3 deploy/apply-nginx-allugme.py \
    /var/www/nginx/nginx.conf \
    deploy/nginx-allugme.locations.conf \
    deploy/nginx-allugme.domain.conf
  sudo docker exec nginx-proxy nginx -t
  sudo docker exec nginx-proxy nginx -s reload
fi

sleep 20
sudo docker ps --filter name=allugme --format 'table {{.Names}}\t{{.Status}}'
curl -fsS -o /dev/null -w "front HTTP %{http_code}\n" http://127.0.0.1/allugme/ || true
curl -fsS -o /dev/null -w "swagger HTTP %{http_code}\n" http://127.0.0.1/allugme/swagger/index.html || true
curl -fsS -o /dev/null -w "https front %{http_code}\n" https://allugme.com.br/allugme/ || true
cd \$APP_DIR && git log -1 --oneline
EOF

echo "OCI: https://allugme.com.br/allugme/"
