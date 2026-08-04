# Seed de demonstração — 5 tenants × 5 temas

**Versão:** 1.0  
**Data:** 2026-08-04  
**Objetivo:** Popular o ambiente com **um tenant ativo por tema oficial**, permitindo demonstrar a troca de layouts na vitrine e no painel.

---

## 1. Por quê

Com 5 temas (`moderno`, `urbano`, `classico`, `minimal`, `porto`), o seed precisa refletir isso:

- Abrir 5 vitrines distintas (slug/subdomínio)  
- No painel, trocar o tema de um tenant e ver a vitrine mudar  
- Aceite `AC-SRC-03` / `AC-SRC-04` e demo comercial sem dados manuais  

---

## 2. Conta plataforma

| Campo | Valor sugerido |
|-------|----------------|
| Role | `saas_admin` |
| E-mail | `admin@plataforma.local` |
| Senha | documentada só em `.env` / secrets de dev (nunca commitar) |

---

## 3. Os 5 tenants (obrigatório no seed MVP)

| # | Slug | Nome fantasia | Tipo | ThemeKey | Notas |
|---|------|---------------|------|----------|-------|
| 1 | `horizon` | Horizon Imóveis | Agency | `moderno` | Open Design; 2 brokers |
| 2 | `vista-urbana` | Vista Urbana | Agency | `urbano` | Tema ref. QuintoAndar; 2 brokers |
| 3 | `casa-tradicao` | Casa & Tradição | Agency | `classico` | tom consultivo |
| 4 | `atlas` | Atlas Residencial | Independent | `minimal` | 1 corretor (= admin) |
| 5 | `porto-lar` | Porto & Lar | Agency | `porto` | 2 brokers |

Todos com `Status = Active`.

### Tenant extra (recomendado)

| Slug | Nome | Status | ThemeKey | Uso |
|------|------|--------|----------|-----|
| `suspenso-demo` | Demo Suspensa | Suspended | `moderno` | Testar exclusão da busca pública |

---

## 4. Usuários por tenant (mínimo)

Para cada tenant **Agency**:

| Role | E-mail padrão | Senha |
|------|---------------|-------|
| `agency_admin` | `admin@{slug}.local` | ver secrets de seed |
| `broker` #1 | `corretor1@{slug}.local` | idem |
| `broker` #2 | `corretor2@{slug}.local` | idem |

Para tenant **Independent** (`atlas`):

| Role | E-mail |
|------|--------|
| `independent_broker` | `admin@atlas.local` |

---

## 5. Imóveis por tenant

| Regra | Valor |
|-------|-------|
| Mínimo por tenant | **3** publicados |
| Mix | pelo menos 1 `rent` e 1 `sale` |
| Fotos | stubs locais ou URLs de demo |
| `responsible_broker_id` | preenchido (obrigatório MVP) |
| Cidades | São Paulo / região (facilita filtros na demo) |

Sugestão de títulos alinhados ao tema (copy só para demo):

- **moderno** — linguagem proptech (“Studio conectado…”)  
- **urbano** — bairros densos  
- **classico** — ticket médio/alto  
- **minimal** — descrições curtas  
- **porto** — proximidade a água / lazer  

---

## 6. Agenda / WhatsApp (demo)

| Item | Seed |
|------|------|
| Buffer tenant | 60 min (padrão) |
| 1 broker com override | 90 min (em `horizon`) — mostra precedência |
| WhatsApp | opcional no seed; se Evolution não estiver up, `WhatsAppNotifyEnabled = false` |
| Visitas | 0 obrigatórias; opcional 1 `pending` no `horizon` para demo de agenda |

---

## 7. URLs de vitrine

Vitrine na **raiz do host** (`/{slug}/`). Painel/API permanecem em `/allugme/`.

```
/horizon/          → tema moderno
/vista-urbana/     → tema urbano
/casa-tradicao/    → tema classico
/atlas/            → tema minimal
/porto-lar/        → tema porto
```

Produção: `https://www.allugme.com.br/{slug}/`  
Local: `http://192.168.15.119/{slug}/`  
Legado `/allugme/t/{slug}/` redireciona para `/{slug}/`.

---

## 8. Script / comando

| Stack | Entrega |
|-------|---------|
| .NET | `dotnet run --project … -- seed` **ou** migration + `SeedDemoData` no boot em Development |
| Idempotência | Reexecutar seed não duplica (upsert por slug/e-mail) |

Arquivo sugerido no repo:

```
backend/src/AlugueMe.Infrastructure/Persistence/Seed/
  DemoSeed.cs
  DemoSeedOptions.cs
```

---

## 9. Roteiro de demo “troca de layout”

1. Abrir as 5 URLs de vitrine (lado a lado ou abas) — cada uma com visual distinto.  
2. Logar como `admin@horizon.local`.  
3. Em Configurações → Tema, trocar de `moderno` → `porto`.  
4. Recarregar `/t/horizon/` — layout Porto com os **mesmos imóveis** do Horizon.  
5. Voltar tema para `moderno`.  

Isso valida `REQ-SRC-03`, `REQ-SRC-04` e o seed.

---

## 10. Rastreabilidade

| Artefato | Referência |
|----------|------------|
| PRD | `REQ-SEED-01` … |
| Aceite | `AC-SEED-*`, `AC-SRC-03`, `AC-SRC-04` |
| Fases | Fase 2 (seed base) + Fase 4 (garantir 5 tenants × temas) |
