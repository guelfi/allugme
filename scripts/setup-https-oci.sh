#!/usr/bin/env bash
# Emite/renova certificado Let's Encrypt e aplica server blocks do domínio.
# Uso (na workstation com chave OCI): ./scripts/setup-https-oci.sh
# Pré-requisito: DNS A de allugme.com.br e www → IP da OCI.
set -euo pipefail

OCI_KEY="${OCI_KEY:-/home/guelfi/Projetos/oci-key-2026-07-29}"
OCI_HOST="${OCI_HOST:-129.153.86.168}"
OCI_USER="${OCI_USER:-ubuntu}"
EMAIL="${LETSENCRYPT_EMAIL:-admin@allugme.com.br}"

ssh -i "$OCI_KEY" -o StrictHostKeyChecking=no "${OCI_USER}@${OCI_HOST}" bash -s << EOF
set -euo pipefail
APP_DIR=/var/www/allugme
EMAIL=$EMAIL

if [ ! -d /etc/letsencrypt/live/allugme.com.br ]; then
  echo "Emitindo certificado (nginx-proxy para ~1 min)..."
  sudo docker stop nginx-proxy
  sudo docker run --rm -p 80:80 \\
    -v /etc/letsencrypt:/etc/letsencrypt \\
    -v /var/lib/letsencrypt:/var/lib/letsencrypt \\
    certbot/certbot certonly --standalone \\
    -d allugme.com.br -d www.allugme.com.br \\
    --email "\$EMAIL" --agree-tos --non-interactive --no-eff-email
  sudo docker start nginx-proxy
else
  echo "Certificado já existe em /etc/letsencrypt/live/allugme.com.br"
fi

cd "\$APP_DIR"
sudo python3 deploy/apply-nginx-allugme.py \\
  /var/www/nginx/nginx.conf \\
  deploy/nginx-allugme.locations.conf \\
  deploy/nginx-allugme.domain.conf
sudo docker exec nginx-proxy nginx -t
sudo docker exec nginx-proxy nginx -s reload

if grep -q '^VITE_API_URL=' .env 2>/dev/null; then
  sed -i 's|^VITE_API_URL=.*|VITE_API_URL=https://www.allugme.com.br/allugme/api/v1|' .env
fi

sudo tee /usr/local/bin/renew-allugme-cert.sh >/dev/null << 'RENEW'
#!/usr/bin/env bash
set -euo pipefail
docker stop nginx-proxy
docker run --rm -p 80:80 \\
  -v /etc/letsencrypt:/etc/letsencrypt \\
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \\
  certbot/certbot renew --quiet
docker start nginx-proxy
docker exec nginx-proxy nginx -s reload || true
RENEW
sudo chmod +x /usr/local/bin/renew-allugme-cert.sh
echo '0 4 1 * * root /usr/local/bin/renew-allugme-cert.sh >> /var/log/allugme-cert-renew.log 2>&1' | sudo tee /etc/cron.d/allugme-cert-renew >/dev/null

curl -fsS -o /dev/null -w 'https front %{http_code}\n' https://allugme.com.br/allugme/
EOF

echo "Pronto: https://allugme.com.br/allugme/"
