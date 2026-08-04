# Estado atual — Allugme (Trilha A)

**Última atualização:** 2026-08-04  
**Fase:** MVP implementado (0→5 scaffold operacional)  
**Repo GitHub:** https://github.com/guelfi/allugme  
**Progresso estimado MVP:** ~70% (código + CI/CD; aceite manual e Evolution real pendentes)

---

## URLs

| Ambiente | URL |
|----------|-----|
| Local | http://192.168.15.119/allugme |
| OCI | http://129.153.86.168/allugme |
| Domínio | Pendente registro.br |

SSH OCI: `ssh -i /home/guelfi/Projetos/oci-key-2026-07-29 ubuntu@129.153.86.168`  
Path no servidor: `/var/www/allugme`

---

## Status por fase

| Fase | Status |
|------|--------|
| 0 Foundation | ✅ Solution .NET 10, Vite React, Docker, health, Redis |
| 1 Auth + Tenancy + RBAC | ✅ JWT, tenants, memberships, saas admin |
| 2 Imóveis + Busca | ✅ CRUD + public search + media |
| 3 Visitas + Buffer | ✅ Slots + buffer + agenda (testes unitários) |
| 3b WhatsApp (Evolution) | ✅ Cliente + fila Redis + webhook + fake mode |
| 4 Temas + Vitrine | ✅ 5 temas + seed 5 tenants + `/t/{slug}/` |
| 5 Polish + Aceite | 🔄 Deploy/CI prontos; executar plano de aceite |

---

## Credenciais seed

| Role | Email | Senha |
|------|-------|-------|
| SaaS Admin | `admin@allugme.com.br` | `Admin123#` |
| Demo tenant | `admin@{slug}.local` | `Demo@123456` |

Slugs: `horizon`, `vista-urbana`, `casa-tradicao`, `atlas`, `porto-lar`

---

## Próxima tarefa

1. Subir stack local: `docker compose -f docker-compose.local.yml up -d --build`  
2. Configurar secrets GH (`OCI_SSH_KEY`, `OCI_HOST`, `OCI_USERNAME`) e clone em `/var/www/allugme`  
3. Registrar domínio no registro.br e apontar para OCI  
4. Executar [05-plano-aceite.md](../05-plano-aceite.md)  
5. Ligar Evolution API real quando disponível  

## Blockers ativos

_Nenhum._ Domínio e Evolution reais são próximos passos operacionais.

## Documentação

| Doc | Status |
|-----|--------|
| Referência busca/listagem QA | ✅ `docs/design/referencia-busca-quintoandar.md` |
| Gravação fluxo UX | ✅ `docs/design/references/quintoandar-busca-listagem-fluxo.webm` |
| CI/CD | ✅ `.github/workflows/{ci,deploy-oci}.yml` |
