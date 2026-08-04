# Alugue.me — Trilha A (.NET 10 + React)

SaaS multi-tenant de vitrine imobiliária + agenda de visitas + WhatsApp (Evolution API).

## URLs

| Ambiente | Painel | API | Swagger | Vitrine |
|----------|--------|-----|---------|---------|
| **Local** (nginx-local) | http://192.168.15.119/allugme | http://192.168.15.119/allugme/api/v1 | http://192.168.15.119/allugme/swagger/index.html | http://192.168.15.119/allugme/t/{slug} |
| **OCI** | http://129.153.86.168/allugme | http://129.153.86.168/allugme/api/v1 | http://129.153.86.168/allugme/swagger/index.html | http://129.153.86.168/allugme/t/{slug} |

Domínio próprio pendente registro.br (batuara.org.br/allugme quando configurado).

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `backend/` | ASP.NET Core 10 (Domain, Application, Infrastructure, Api) |
| `frontend/dashboard/` | Painel React (Vite + TypeScript) |
| `themes/official/` | Vitrine HTML (moderno, classico, urbano, minimal) |
| `deploy/` | Fragmentos nginx + script de apply idempotente |
| `storage/` | Mídia, logs e sites estáticos (dev) |
| `docs/` | PRD, DET, fases, aceite, handoff |

## Pré-requisitos

- .NET 10 SDK
- Node.js 20+
- Docker + rede `projetos-local` (local) ou `www_projetos-net` (OCI)

## Desenvolvimento local (frontend)

```bash
cd frontend/dashboard
cp ../../.env.example .env.local   # opcional
npm install
npm run dev
# API em http://localhost:5080/api/v1 (proxy Vite) ou stack Docker abaixo
```

Build de produção:

```bash
cd frontend/dashboard
VITE_BASE_PATH=/allugme/ npm run build
```

## Stack Docker local (paridade OCI)

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d --build
```

Acesso via nginx-local: http://192.168.15.119/allugme

## Stack Docker OCI

```bash
docker compose up -d --build
```

Deploy automatizado: workflow `.github/workflows/deploy-oci.yml` (secrets `OCI_SSH_KEY`, `OCI_HOST`, `OCI_USERNAME`).

## Documentação

Comece por [`docs/00-README.md`](docs/00-README.md).
