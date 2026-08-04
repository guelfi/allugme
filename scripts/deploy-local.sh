#!/usr/bin/env bash
# Sobe (ou atualiza) a stack local Allugue.me na rede projetos-local.
# Acesso: http://192.168.15.119/allugme/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! docker network inspect projetos-local >/dev/null 2>&1; then
  echo "Criando rede projetos-local..."
  docker network create projetos-local
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Criado .env a partir de .env.example"
fi

echo ">>> Build & up (docker-compose.local.yml)"
docker compose -f docker-compose.local.yml --env-file .env up -d --build --remove-orphans

# Conecta nginx-local à rede do projeto (idempotente)
docker network connect allugme_allugme-net nginx-local 2>/dev/null || true
docker network connect projetos-local allugme-api 2>/dev/null || true
docker network connect projetos-local allugme-frontend 2>/dev/null || true

# Recarrega nginx-local se o conf local já tiver /allugme/
if docker ps --format '{{.Names}}' | grep -qx nginx-local; then
  if [ -f /home/guelfi/Projetos/nginx/nginx.local.conf ] && grep -q 'allugme' /home/guelfi/Projetos/nginx/nginx.local.conf; then
    docker exec nginx-local nginx -t && docker exec nginx-local nginx -s reload
    echo "nginx-local recarregado"
  else
    echo "AVISO: blocos /allugme/ ausentes em nginx.local.conf — confira o proxy."
  fi
else
  echo "AVISO: container nginx-local não está rodando."
  echo "  Suba com: docker compose -f /home/guelfi/Projetos/docker-compose.nginx.local.yml up -d"
fi

echo "Aguardando health..."
sleep 15
docker ps --filter name=allugme --format 'table {{.Names}}\t{{.Status}}'
curl -fsS -o /dev/null -w "front HTTP %{http_code}\n" http://192.168.15.119/allugme/ || true
curl -fsS -o /dev/null -w "swagger HTTP %{http_code}\n" http://192.168.15.119/allugme/swagger/index.html || true
echo "Local: http://192.168.15.119/allugme/"
