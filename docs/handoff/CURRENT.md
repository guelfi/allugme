# Estado atual — Allugme

**Última atualização:** 2026-08-04  
**Fase:** MVP implementado (0→5 scaffold operacional) + HTTPS em produção  
**Repo GitHub:** https://github.com/guelfi/allugme  
**Progresso estimado MVP:** ~85% (código + CI/CD + DNS/TLS; aceite formal e Evolution real pendentes)

---

## URLs

| Ambiente | URL |
|----------|-----|
| Local | http://192.168.15.119/allugme |
| OCI (IP) | http://129.153.86.168/allugme |
| Produção | https://allugme.com.br/allugme |

SSH OCI: `ssh -i /home/guelfi/Projetos/oci-key-2026-07-29 ubuntu@129.153.86.168`  
Path no servidor: `/var/www/allugme`

---

## Status por fase

| Fase | Status |
|------|--------|
| 0 Foundation | ✅ Solution .NET 10, Vite React, Docker, health, Redis |
| 1 Auth + Tenancy + RBAC | ✅ JWT, tenants, memberships, shells por papel |
| 2 Imóveis + Busca | ✅ CRUD + public search + media |
| 3 Visitas + Buffer | ✅ Slots + buffer + agenda |
| 3b WhatsApp (Evolution) | ✅ Cliente + fila Redis + webhook + fake mode |
| 4 Temas + Vitrine | ✅ 5 temas + seed 5 tenants + `/{slug}/` |
| 5 Polish + Aceite | 🔄 Landing/planos/HTTPS ok; executar plano de aceite formal |

---

## Credenciais seed

| Role | Email | Senha |
|------|-------|-------|
| SaaS Admin | `admin@allugme.com.br` | `Admin123#` |
| Demo tenant | `admin@{slug}.local` | `Demo@123456` |

Slugs: `horizon`, `vista-urbana`, `casa-tradicao`, `atlas`, `porto-lar`

---

## Próxima tarefa

1. Executar [05-plano-aceite.md](../05-plano-aceite.md) e registrar evidências  
2. Ligar Evolution API real quando disponível  
3. Renovação Let's Encrypt já com cron na OCI (`renew-allugme-cert.sh`)

## Blockers ativos

_Nenhum._ Aceite formal e Evolution real são próximos passos operacionais.

## Documentação

| Doc | Status |
|-----|--------|
| Pacote docs (flat) | ✅ `docs/*.md` + `handoff/` + `design/` (sem oscar/sua-trilha) |
| Referência busca/listagem QA | ✅ `docs/design/referencia-busca-quintoandar.md` |
| CI/CD | ✅ `.github/workflows/{ci,deploy-oci}.yml` |
| HTTPS produção | ✅ Let's Encrypt `allugme.com.br` |
