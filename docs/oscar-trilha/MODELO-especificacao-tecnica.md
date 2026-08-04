# Especificação Técnica — [Nome do Projeto]

**Versão:** _preencher_  
**Data:** _preencher_  
**Trilha:** B — PHP + HTML/CSS/JS  
**Autor:** _preencher_

| Campo | Valor (definido por você) |
|-------|---------------------------|
| Nome do produto | `[Nome do Projeto]` |
| Host local / base URL (dev) | _preencher — próprio da Trilha B_ |
| Domínio previsto (prod) | _preencher — próprio da Trilha B_ |

> Não reutilize marca, slug ou domínio da Trilha A (nem variantes ortográficas). Este template não cita esse nome de propósito.

---

## 1. Arquitetura

_preencher — descrever componentes (front controller, pastas, como painel e vitrine se relacionam com o backend e com a Evolution API)_

```
Visitante → Vitrine (HTML temas) → Backend PHP → Banco
Corretor  → Painel (HTML/JS)     → Backend PHP → Banco
Backend PHP → Evolution API → WhatsApp
Evolution API (webhook) → Backend PHP
```

| Componente | Responsabilidade |
|------------|------------------|
| _preencher_ | _preencher_ |

## 2. Estrutura de pastas (proposta)

```
[Nome do Projeto]/
├── public/                 # _preencher_
├── config/                 # _preencher_ (incluir Evolution)
├── src/                    # _preencher_
├── views/ ou templates/    # painel
├── themes/                 # vitrine — 3 oficiais
│   └── official/
│       ├── moderno/
│       ├── classico/
│       └── minimal/
├── storage/                # _preencher_
├── database/               # migrations / SQL
└── ...
```

_Ajustar livremente; manter a ideia de temas oficiais separados do painel._

## 3. Modelo de dados (MVP)

| Entidade | Campos principais |
|----------|-------------------|
| User | _preencher_ |
| Tenant | _preencher_ |
| TenantMembership | _preencher_ |
| Property | _preencher_ |
| PropertyMedia | _preencher_ |
| TenantSettings | buffer, duração visita, WhatsApp, Evolution instance |
| BrokerSettings | override buffer/duração/WhatsApp |
| CalendarBlock | _preencher_ |
| Visit | _preencher — incluir código de confirmação_ |
| WhatsAppOutboundLog | _preencher (opcional recomendado)_ |

## 4. Auth e RBAC

- Mecanismo de sessão/token: _preencher_  
- Roles suportados: alinhar com `../compartilhado/rbac-matriz.md`  
- Como garante isolamento por tenant em **toda** query: _preencher_

## 5. Rotas / endpoints principais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| _preencher_ | | | Login |
| | | | CRUD imóveis |
| | | | Busca pública |
| | | | Slots de visita |
| | | | Solicitar visita |
| | | | Agenda / confirmar |
| | | | Settings buffer + WhatsApp |
| | | | Teste envio WhatsApp |
| | | | Webhook Evolution |
| | | | Tema do tenant |

## 6. Agenda e buffer

Descrever o algoritmo:

1. Duração efetiva = _preencher_  
2. Buffer efetivo = corretor > tenant > **60**  
3. Como calcula slots livres: _preencher_  
4. Como evita double-booking (transação / lock): _preencher_  
5. Timezone: _preencher (recomendado America/Sao_Paulo)_  
6. Status inicial da visita: _preencher (sugerido: pending)_  

## 6.1 WhatsApp — Evolution API (MVP)

| Tópico | Descrição |
|--------|-----------|
| Onde configura o número | _preencher — painel tenant e/ou corretor_ |
| Credenciais Evolution | _preencher — URL, apikey, instance_ |
| Quando envia mensagem | _preencher — ex.: nova visita pending_ |
| Como confirma/recusa | _preencher — ex.: SIM/NAO + código_ |
| Webhook inbound | _preencher — rota e validação de secret_ |
| Destino da notificação | _preencher — precedência corretor > tenant_ |
| Se Evolution falhar | _preencher — visita deve continuar existindo_ |
| Aviso ao visitante | _preencher — ao confirmar/recusar_ |
| Fila (Redis ou equiv.) | _preencher — envio assíncrono_ |

## 6.2 Redis (ou equivalente)

| Uso no MVP | Como você implementa |
|------------|----------------------|
| Fila de WhatsApp | _preencher_ |
| Lock na agenda | _preencher_ |
| Idempotência webhook | _preencher_ |
| Cache busca/slots | _preencher_ |
| Rate limit | _preencher_ |

## 7. Temas (vitrine)

### 7.1 Estrutura

```
themes/official/{key}/
  theme.json
  pages/home.html
  pages/listing.html
  pages/property.html
  pages/schedule.html
  partials/...
  assets/...
```

### 7.2 Placeholders obrigatórios

Listar os que o backend injeta:

| Placeholder | Uso |
|-------------|-----|
| `{{tenant.name}}` | _manter_ |
| `{{property.*}}` | _preencher_ |
| `{{visit.*}}` | _preencher_ |
| _outros_ | |

### 7.3 Segurança dos temas

- Temas são HTML/CSS/JS — **sem** PHP executável enviado pelo cliente.  
- Escape de saída: _preencher como será feito_

## 8. Painel (HTML/CSS/JS)

Telas MVP:

- [ ] Login  
- [ ] Imóveis (lista/form/fotos)  
- [ ] Agenda / visitas  
- [ ] Configurações (buffer, tema, **WhatsApp/Evolution**)  
- [ ] Admin plataforma (tenants)  

Como o JS chama o backend: _preencher (form POST, fetch JSON, etc.)_

## 9. Segurança

| Tema | Medida |
|------|--------|
| SQL injection | _preencher (PDO prepared statements, etc.)_ |
| XSS | _preencher_ |
| CSRF | _preencher_ |
| Upload | _preencher_ |
| Senhas | _preencher (password_hash)_ |
| Isolamento tenant | _preencher_ |
| Secrets Evolution | _preencher — não expor no front_ |
| Webhook | _preencher — validar secret_ |

## 10. Testes e aceite

- Como você vai validar buffer, isolamento e WhatsApp: _preencher_  
- Checklist alinhado ao escopo compartilhado da rinha: _preencher_

## 11. Deploy

| Ambiente | Base URL / domínio | Notas |
|----------|--------------------|-------|
| Dev | _preencher — host próprio_ | _preencher — Evolution local/remoto_ |
| Prod | _preencher — domínio próprio_ | _preencher_ |

Confirmar: URLs acima **não** derivam do nome/domínio da Trilha A.

## 12. Fora do MVP (backlog)

- _preencher_ (tema custom, e-mail, chat livre WhatsApp, etc.)

## 13. Decisões em aberto

| # | Pergunta | Decisão |
|---|----------|---------|
| 1 | PHP puro vs microframework | _preencher_ |
| 2 | Banco | _preencher_ |
| 3 | Evolution: instância por tenant vs plataforma | _preencher_ |
